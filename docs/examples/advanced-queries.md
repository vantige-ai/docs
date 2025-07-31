---
sidebar_position: 2
---

# Advanced Queries

Advanced usage patterns and techniques for the Vantige AI TypeScript SDK.

## Batch Processing

Process multiple queries efficiently:

```typescript
import { VantigeClient, QueryParams, QueryResponse } from '@vantige-ai/typescript-sdk';

class BatchQueryProcessor {
  constructor(private client: VantigeClient) {}
  
  async batchQuery(
    corpusId: string, 
    queries: string[], 
    options: Partial<QueryParams> = {}
  ): Promise<Map<string, QueryResponse>> {
    const results = new Map<string, QueryResponse>();
    
    // Process queries in parallel with concurrency limit
    const concurrencyLimit = 5;
    
    for (let i = 0; i < queries.length; i += concurrencyLimit) {
      const batch = queries.slice(i, i + concurrencyLimit);
      const promises = batch.map(query => 
        this.client.query({
          corpusId,
          query,
          ...options
        }).then(response => ({ query, response }))
        .catch(error => ({ query, error }))
      );
      
      const batchResults = await Promise.allSettled(promises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.response) {
          results.set(result.value.query, result.value.response);
        } else {
          console.error(`Failed query: ${batch[index]}`);
        }
      });
    }
    
    return results;
  }
}

// Usage
const processor = new BatchQueryProcessor(client);
const queries = [
  'What is the pricing?',
  'How do I get started?',
  'What are the API limits?'
];

const results = await processor.batchQuery('docs', queries, { 
  generateAnswer: true,
  limit: 3 
});

results.forEach((response, query) => {
  console.log(`Q: ${query}`);
  console.log(`A: ${response.answer}\n`);
});
```

## Contextual Search

Build context-aware search functionality:

```typescript
interface SearchContext {
  previousQueries: string[];
  userRole?: string;
  department?: string;
}

class ContextualSearchClient {
  constructor(private client: VantigeClient) {}
  
  async contextualQuery(
    corpusId: string,
    query: string,
    context: SearchContext
  ): Promise<QueryResponse> {
    // Enhance query with context
    const enhancedQuery = this.buildContextualQuery(query, context);
    
    const response = await this.client.query({
      corpusId,
      query: enhancedQuery,
      generateAnswer: true,
      limit: 10
    });
    
    // Filter results based on context
    if (context.department) {
      response.results = response.results.filter(result => 
        result.metadata?.department === context.department ||
        !result.metadata?.department
      );
    }
    
    return response;
  }
  
  private buildContextualQuery(query: string, context: SearchContext): string {
    let enhanced = query;
    
    // Add role context
    if (context.userRole) {
      enhanced = `${context.userRole} question: ${enhanced}`;
    }
    
    // Add previous query context for follow-ups
    if (context.previousQueries.length > 0) {
      const lastQuery = context.previousQueries[context.previousQueries.length - 1];
      if (this.isFollowUpQuery(query)) {
        enhanced = `${lastQuery} ${enhanced}`;
      }
    }
    
    return enhanced;
  }
  
  private isFollowUpQuery(query: string): boolean {
    const followUpIndicators = [
      'what about', 'how about', 'and', 'also',
      'more', 'else', 'other', 'another'
    ];
    
    const lowerQuery = query.toLowerCase();
    return followUpIndicators.some(indicator => 
      lowerQuery.startsWith(indicator)
    );
  }
}
```

## Intelligent Caching

Implement caching for better performance:

```typescript
interface CacheEntry {
  response: QueryResponse;
  timestamp: number;
  hits: number;
}

class CachedVantigeClient {
  private cache = new Map<string, CacheEntry>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private readonly maxCacheSize = 100;
  
  constructor(private client: VantigeClient) {}
  
  async query(params: QueryParams): Promise<QueryResponse> {
    const cacheKey = this.getCacheKey(params);
    const cached = this.cache.get(cacheKey);
    
    // Check cache validity
    if (cached && this.isCacheValid(cached)) {
      cached.hits++;
      return cached.response;
    }
    
    // Make actual query
    const response = await this.client.query(params);
    
    // Update cache
    this.updateCache(cacheKey, response);
    
    return response;
  }
  
  private getCacheKey(params: QueryParams): string {
    return JSON.stringify({
      corpusId: params.corpusId,
      query: params.query.toLowerCase().trim(),
      limit: params.limit,
      generateAnswer: params.generateAnswer
    });
  }
  
  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.cacheTimeout;
  }
  
  private updateCache(key: string, response: QueryResponse): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const lruKey = this.findLRUKey();
      if (lruKey) this.cache.delete(lruKey);
    }
    
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      hits: 0
    });
  }
  
  private findLRUKey(): string | undefined {
    let lruKey: string | undefined;
    let minHits = Infinity;
    let oldestTime = Date.now();
    
    this.cache.forEach((entry, key) => {
      const score = entry.hits * 10000 + (Date.now() - entry.timestamp);
      if (score < minHits) {
        minHits = score;
        lruKey = key;
      }
    });
    
    return lruKey;
  }
  
  // Cache statistics
  getStats() {
    let totalHits = 0;
    let validEntries = 0;
    
    this.cache.forEach(entry => {
      totalHits += entry.hits;
      if (this.isCacheValid(entry)) validEntries++;
    });
    
    return {
      size: this.cache.size,
      validEntries,
      totalHits,
      hitRate: totalHits / (totalHits + this.cache.size)
    };
  }
}
```

## Semantic Search with Filters

Combine semantic search with metadata filtering:

```typescript
interface SearchFilters {
  dateRange?: { start: Date; end: Date };
  tags?: string[];
  author?: string;
  minScore?: number;
}

class FilteredSearchClient {
  constructor(private client: VantigeClient) {}
  
  async searchWithFilters(
    corpusId: string,
    query: string,
    filters: SearchFilters
  ): Promise<QueryResponse> {
    // Get more results than needed for filtering
    const response = await this.client.query({
      corpusId,
      query,
      limit: 50, // Get extra results for filtering
      generateAnswer: false // Generate after filtering
    });
    
    // Apply filters
    let filteredResults = response.results;
    
    if (filters.minScore) {
      filteredResults = filteredResults.filter(
        result => result.score >= filters.minScore
      );
    }
    
    if (filters.dateRange) {
      filteredResults = filteredResults.filter(result => {
        const date = new Date(result.metadata?.date || 0);
        return date >= filters.dateRange!.start && 
               date <= filters.dateRange!.end;
      });
    }
    
    if (filters.tags && filters.tags.length > 0) {
      filteredResults = filteredResults.filter(result => {
        const resultTags = result.metadata?.tags || [];
        return filters.tags!.some(tag => resultTags.includes(tag));
      });
    }
    
    if (filters.author) {
      filteredResults = filteredResults.filter(
        result => result.metadata?.author === filters.author
      );
    }
    
    // If we have results, generate answer with filtered context
    if (filteredResults.length > 0 && response.results.length > 0) {
      const topResults = filteredResults.slice(0, 5);
      const context = topResults
        .map(r => r.content)
        .join('\n\n');
      
      // Make a new query with context for answer generation
      const answerResponse = await this.client.query({
        corpusId,
        query: `Based on the following context, ${query}\n\nContext:\n${context}`,
        generateAnswer: true,
        limit: 5
      });
      
      return {
        ...response,
        results: filteredResults,
        answer: answerResponse.answer
      };
    }
    
    return {
      ...response,
      results: filteredResults
    };
  }
}
```

## Conversation Memory

Build conversational search with memory:

```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

class ConversationalSearch {
  private conversations = new Map<string, Message[]>();
  
  constructor(
    private client: VantigeClient,
    private maxContextLength = 1000
  ) {}
  
  async chat(
    sessionId: string,
    corpusId: string,
    message: string
  ): Promise<string> {
    // Get or create conversation
    const conversation = this.conversations.get(sessionId) || [];
    
    // Add user message
    conversation.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });
    
    // Build context from conversation history
    const context = this.buildContext(conversation);
    
    // Query with context
    const response = await this.client.query({
      corpusId,
      query: `${context}\n\nUser: ${message}`,
      generateAnswer: true,
      limit: 5
    });
    
    const answer = response.answer || 'I couldn\'t find an answer to that question.';
    
    // Add assistant response
    conversation.push({
      role: 'assistant',
      content: answer,
      timestamp: new Date()
    });
    
    // Update stored conversation
    this.conversations.set(sessionId, conversation);
    
    // Clean old conversations periodically
    this.cleanOldConversations();
    
    return answer;
  }
  
  private buildContext(conversation: Message[]): string {
    // Get recent messages that fit in context window
    const recentMessages = conversation.slice(-6); // Last 3 exchanges
    
    let context = 'Previous conversation:\n';
    let contextLength = context.length;
    
    for (const msg of recentMessages) {
      const msgText = `${msg.role}: ${msg.content}\n`;
      if (contextLength + msgText.length > this.maxContextLength) {
        break;
      }
      context += msgText;
      contextLength += msgText.length;
    }
    
    return context;
  }
  
  private cleanOldConversations(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    this.conversations.forEach((messages, sessionId) => {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.timestamp < oneHourAgo) {
        this.conversations.delete(sessionId);
      }
    });
  }
  
  getConversation(sessionId: string): Message[] {
    return this.conversations.get(sessionId) || [];
  }
  
  clearConversation(sessionId: string): void {
    this.conversations.delete(sessionId);
  }
}
```

## Usage Example

```typescript
// Initialize clients
const client = new VantigeClient({ apiKey: process.env.VANTIGE_API_KEY! });
const cachedClient = new CachedVantigeClient(client);
const conversational = new ConversationalSearch(client);

// Example: Cached search
const result1 = await cachedClient.query({
  corpusId: 'docs',
  query: 'pricing plans',
  generateAnswer: true
});

// This will be instant (from cache)
const result2 = await cachedClient.query({
  corpusId: 'docs',
  query: 'pricing plans',
  generateAnswer: true
});

// Example: Conversational search
const sessionId = 'user-123';
const answer1 = await conversational.chat(
  sessionId, 
  'support',
  'What are your business hours?'
);

// Follow-up uses conversation context
const answer2 = await conversational.chat(
  sessionId,
  'support', 
  'What about on weekends?'
);

// Example: Filtered search
const filtered = new FilteredSearchClient(client);
const results = await filtered.searchWithFilters('blog', 'AI trends', {
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31')
  },
  tags: ['artificial-intelligence', 'machine-learning'],
  minScore: 0.8
});
```

## Next Steps

- Explore [Error Handling](./error-handling) patterns for robust applications
- Check the [API Reference](../api/client) for all available options
- See [Basic Usage](./basic-usage) for simpler examples