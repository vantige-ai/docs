---
sidebar_position: 3
---

# Error Handling Examples

Real-world error handling patterns for the Vantige AI TypeScript SDK.

## Basic Error Handling

Handle common errors gracefully:

```typescript
import { VantigeClient, VantigeSDKError } from '@vantige-ai/typescript-sdk';

async function safeQuery(client: VantigeClient, params: QueryParams) {
  try {
    const response = await client.query(params);
    return { success: true, data: response };
  } catch (error) {
    if (error instanceof VantigeSDKError) {
      // Handle SDK-specific errors
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      };
    }
    
    // Handle unexpected errors
    return {
      success: false,
      error: {
        code: 500,
        message: 'An unexpected error occurred',
        details: { originalError: error }
      }
    };
  }
}

// Usage
const result = await safeQuery(client, {
  corpusId: 'docs',
  query: 'How do I get started?'
});

if (result.success) {
  console.log('Results:', result.data.results);
} else {
  console.error(`Error ${result.error.code}: ${result.error.message}`);
}
```

## Retry with Exponential Backoff

Implement intelligent retry logic:

```typescript
interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: number[];
}

class RetryableVantigeClient {
  private defaultOptions: Required<RetryOptions> = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableErrors: [429, 500, 502, 503, 504]
  };
  
  constructor(
    private client: VantigeClient,
    options?: RetryOptions
  ) {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }
  
  async query(
    params: QueryParams,
    options?: RetryOptions
  ): Promise<QueryResponse> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        return await this.client.query(params);
      } catch (error) {
        lastError = error;
        
        // Check if error is retryable
        if (!this.isRetryable(error, opts.retryableErrors)) {
          throw error;
        }
        
        // Don't retry after last attempt
        if (attempt === opts.maxRetries) {
          break;
        }
        
        // Calculate delay
        const delay = this.calculateDelay(attempt, error, opts);
        console.log(`Retry ${attempt + 1}/${opts.maxRetries} after ${delay}ms`);
        
        // Wait before retry
        await this.sleep(delay);
      }
    }
    
    throw lastError || new Error('All retries failed');
  }
  
  private isRetryable(error: any, retryableErrors: number[]): boolean {
    if (!(error instanceof VantigeSDKError)) {
      // Retry network errors
      return error.code === 'ECONNRESET' || 
             error.code === 'ETIMEDOUT' ||
             error.code === 'ENOTFOUND';
    }
    
    return retryableErrors.includes(error.code);
  }
  
  private calculateDelay(
    attempt: number,
    error: any,
    options: Required<RetryOptions>
  ): number {
    // Use server-provided retry delay if available
    if (error instanceof VantigeSDKError && 
        error.code === 429 && 
        error.details?.retryAfter) {
      return error.details.retryAfter * 1000;
    }
    
    // Exponential backoff with jitter
    const exponentialDelay = Math.min(
      options.initialDelay * Math.pow(options.backoffMultiplier, attempt),
      options.maxDelay
    );
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * exponentialDelay;
    
    return Math.floor(exponentialDelay + jitter);
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const retryableClient = new RetryableVantigeClient(client, {
  maxRetries: 5,
  initialDelay: 500,
  retryableErrors: [429, 500, 502, 503]
});

try {
  const response = await retryableClient.query({
    corpusId: 'docs',
    query: 'complex query that might fail'
  });
} catch (error) {
  console.error('Failed after all retries:', error);
}
```

## Circuit Breaker Pattern

Prevent cascading failures:

```typescript
enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  monitoringPeriod?: number;
}

class CircuitBreakerClient {
  private state = CircuitState.CLOSED;
  private failures = 0;
  private lastFailureTime?: number;
  private successCount = 0;
  
  private options: Required<CircuitBreakerOptions> = {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    monitoringPeriod: 60000 // 1 minute
  };
  
  constructor(
    private client: VantigeClient,
    options?: CircuitBreakerOptions
  ) {
    this.options = { ...this.options, ...options };
  }
  
  async query(params: QueryParams): Promise<QueryResponse> {
    // Check circuit state
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }
    
    try {
      const response = await this.client.query(params);
      this.onSuccess();
      return response;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }
  
  private shouldAttemptReset(): boolean {
    return this.lastFailureTime !== undefined &&
           Date.now() - this.lastFailureTime >= this.options.resetTimeout;
  }
  
  private onSuccess(): void {
    this.failures = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      // Require multiple successes to fully close
      if (this.successCount >= 3) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        console.log('Circuit breaker closed - service recovered');
      }
    }
  }
  
  private onFailure(error: any): void {
    this.lastFailureTime = Date.now();
    this.successCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      console.log('Circuit breaker opened - test request failed');
      return;
    }
    
    this.failures++;
    
    if (this.failures >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      console.log(`Circuit breaker opened - ${this.failures} failures`);
    }
  }
  
  getState(): { state: CircuitState; failures: number } {
    return {
      state: this.state,
      failures: this.failures
    };
  }
}
```

## Error Recovery Strategies

Implement fallback mechanisms:

```typescript
class ResilientSearchClient {
  constructor(
    private primaryClient: VantigeClient,
    private cacheClient?: CachedVantigeClient
  ) {}
  
  async searchWithFallback(
    corpusId: string,
    query: string
  ): Promise<SearchResult> {
    const strategies = [
      () => this.tryPrimarySearch(corpusId, query),
      () => this.tryCachedSearch(corpusId, query),
      () => this.trySimplifiedSearch(corpusId, query),
      () => this.returnDefaultResponse(query)
    ];
    
    for (const strategy of strategies) {
      try {
        return await strategy();
      } catch (error) {
        console.log(`Strategy failed: ${strategy.name}`, error);
        continue;
      }
    }
    
    throw new Error('All search strategies failed');
  }
  
  private async tryPrimarySearch(
    corpusId: string,
    query: string
  ): Promise<SearchResult> {
    const response = await this.primaryClient.query({
      corpusId,
      query,
      generateAnswer: true,
      limit: 10
    });
    
    return {
      type: 'primary',
      answer: response.answer,
      results: response.results,
      confidence: 'high'
    };
  }
  
  private async tryCachedSearch(
    corpusId: string,
    query: string
  ): Promise<SearchResult> {
    if (!this.cacheClient) {
      throw new Error('No cache client available');
    }
    
    const response = await this.cacheClient.query({
      corpusId,
      query,
      generateAnswer: false,
      limit: 5
    });
    
    return {
      type: 'cached',
      answer: 'Showing cached results',
      results: response.results,
      confidence: 'medium'
    };
  }
  
  private async trySimplifiedSearch(
    corpusId: string,
    query: string
  ): Promise<SearchResult> {
    // Simplify query for better chance of success
    const keywords = this.extractKeywords(query);
    const simplifiedQuery = keywords.join(' ');
    
    const response = await this.primaryClient.query({
      corpusId,
      query: simplifiedQuery,
      generateAnswer: false,
      limit: 3
    });
    
    return {
      type: 'simplified',
      answer: `Results for: ${simplifiedQuery}`,
      results: response.results,
      confidence: 'low'
    };
  }
  
  private returnDefaultResponse(query: string): SearchResult {
    return {
      type: 'default',
      answer: 'Search is temporarily unavailable. Please try again later.',
      results: [],
      confidence: 'none'
    };
  }
  
  private extractKeywords(query: string): string[] {
    // Simple keyword extraction
    const stopWords = new Set([
      'what', 'is', 'the', 'how', 'do', 'i', 'can',
      'where', 'when', 'why', 'a', 'an', 'and', 'or'
    ]);
    
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => !stopWords.has(word) && word.length > 2);
  }
}

interface SearchResult {
  type: 'primary' | 'cached' | 'simplified' | 'default';
  answer?: string;
  results: any[];
  confidence: 'high' | 'medium' | 'low' | 'none';
}
```

## Error Reporting and Monitoring

Track and report errors effectively:

```typescript
interface ErrorMetrics {
  totalErrors: number;
  errorsByCode: Map<number, number>;
  errorRate: number;
  lastError?: {
    code: number;
    message: string;
    timestamp: Date;
  };
}

class MonitoredVantigeClient {
  private metrics: ErrorMetrics = {
    totalErrors: 0,
    errorsByCode: new Map(),
    errorRate: 0
  };
  
  private requests = 0;
  private errorCallbacks: ((error: VantigeSDKError) => void)[] = [];
  
  constructor(
    private client: VantigeClient,
    private windowSize = 100 // Calculate error rate over last N requests
  ) {}
  
  async query(params: QueryParams): Promise<QueryResponse> {
    this.requests++;
    
    try {
      const response = await this.client.query(params);
      this.updateErrorRate();
      return response;
    } catch (error) {
      if (error instanceof VantigeSDKError) {
        this.recordError(error);
        this.notifyErrorCallbacks(error);
      }
      throw error;
    }
  }
  
  private recordError(error: VantigeSDKError): void {
    this.metrics.totalErrors++;
    
    const count = this.metrics.errorsByCode.get(error.code) || 0;
    this.metrics.errorsByCode.set(error.code, count + 1);
    
    this.metrics.lastError = {
      code: error.code,
      message: error.message,
      timestamp: new Date()
    };
    
    this.updateErrorRate();
    
    // Log structured error data
    console.error({
      timestamp: new Date().toISOString(),
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      },
      metrics: {
        totalErrors: this.metrics.totalErrors,
        errorRate: this.metrics.errorRate,
        requests: this.requests
      }
    });
  }
  
  private updateErrorRate(): void {
    const recentRequests = Math.min(this.requests, this.windowSize);
    if (recentRequests > 0) {
      this.metrics.errorRate = this.metrics.totalErrors / recentRequests;
    }
  }
  
  private notifyErrorCallbacks(error: VantigeSDKError): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (e) {
        console.error('Error in error callback:', e);
      }
    });
  }
  
  onError(callback: (error: VantigeSDKError) => void): void {
    this.errorCallbacks.push(callback);
  }
  
  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }
  
  getHealthStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    if (this.metrics.errorRate < 0.01) return 'healthy';
    if (this.metrics.errorRate < 0.1) return 'degraded';
    return 'unhealthy';
  }
}

// Usage with monitoring
const monitoredClient = new MonitoredVantigeClient(client);

// Add error reporting
monitoredClient.onError((error) => {
  // Send to error tracking service
  errorTracker.report({
    error,
    user: currentUser,
    context: { feature: 'search' }
  });
  
  // Alert if critical error
  if (error.code >= 500) {
    alerting.send('Vantige API 500 error', error);
  }
});

// Monitor health
setInterval(() => {
  const health = monitoredClient.getHealthStatus();
  const metrics = monitoredClient.getMetrics();
  
  if (health !== 'healthy') {
    console.warn(`API health: ${health}`, metrics);
  }
}, 60000); // Check every minute
```

## Complete Error Handling Example

```typescript
// Create a fully resilient client
const vantigeClient = new VantigeClient({ 
  apiKey: process.env.VANTIGE_API_KEY! 
});

const retryableClient = new RetryableVantigeClient(vantigeClient);
const circuitBreakerClient = new CircuitBreakerClient(retryableClient);
const monitoredClient = new MonitoredVantigeClient(circuitBreakerClient);
const cachedClient = new CachedVantigeClient(monitoredClient);
const resilientClient = new ResilientSearchClient(
  monitoredClient,
  cachedClient
);

// Use with comprehensive error handling
async function performSearch(query: string) {
  try {
    const result = await resilientClient.searchWithFallback('docs', query);
    
    if (result.confidence === 'none') {
      showWarning('Search unavailable - showing default message');
    } else if (result.confidence === 'low') {
      showWarning('Showing simplified search results');
    }
    
    return result;
  } catch (error) {
    // Log error for debugging
    console.error('Search failed:', error);
    
    // Show user-friendly message
    showError('Unable to perform search. Please try again later.');
    
    // Track error for monitoring
    trackEvent('search_error', {
      error: error.message,
      query
    });
    
    return null;
  }
}
```

## Next Steps

- Review the [Error Reference](../api/errors) for all error codes
- See [Advanced Queries](./advanced-queries) for more complex patterns
- Check [Basic Usage](./basic-usage) for simpler examples