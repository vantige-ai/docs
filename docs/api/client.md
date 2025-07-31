---
sidebar_position: 1
---

# VantigeClient

The main client class for interacting with the Vantige AI API.

## Constructor

```typescript
new VantigeClient(config: VantigeClientConfig)
```

### Parameters

- `config` - Configuration object for the client
  - `apiKey` (string, required) - Your Vantige API key
  - `baseUrl` (string, optional) - Custom API endpoint (defaults to production URL)

### Example

```typescript
import { VantigeClient } from '@vantige-ai/typescript-sdk';

const client = new VantigeClient({
  apiKey: process.env.VANTIGE_API_KEY
});
```

## Methods

### listKnowledgeBases()

Lists all knowledge bases available to your organization.

```typescript
listKnowledgeBases(): Promise<KnowledgeBase[]>
```

#### Returns

`Promise<KnowledgeBase[]>` - Array of knowledge base objects

#### Example

```typescript
const knowledgeBases = await client.listKnowledgeBases();

knowledgeBases.forEach(kb => {
  console.log(`${kb.name} (${kb.corpusId}): ${kb.description}`);
});
```

#### Response Type

```typescript
interface KnowledgeBase {
  corpusId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}
```

### query()

Queries a specific knowledge base with semantic search and optional AI generation.

```typescript
query(params: QueryParams): Promise<QueryResponse>
```

#### Parameters

- `params` - Query parameters object
  - `corpusId` (string, required) - The ID of the knowledge base to query
  - `query` (string, required) - The search query
  - `limit` (number, optional) - Maximum number of results (1-100, default: 10)
  - `generateAnswer` (boolean, optional) - Whether to generate an AI answer (default: false)

#### Returns

`Promise<QueryResponse>` - Query response with results and optional AI answer

#### Example

```typescript
// Basic search
const searchResults = await client.query({
  corpusId: 'docs',
  query: 'How do I authenticate?',
  limit: 5
});

// With AI-generated answer
const response = await client.query({
  corpusId: 'docs',
  query: 'What is the refund policy?',
  generateAnswer: true
});

console.log('Answer:', response.answer);
console.log('Sources:', response.results.map(r => r.title));
```

#### Response Type

```typescript
interface QueryResponse {
  results: SearchResult[];
  answer?: string;
  queryId: string;
  corpusId: string;
}

interface SearchResult {
  id: string;
  title: string;
  content: string;
  url?: string;
  score: number;
  metadata: Record<string, any>;
}
```

## Error Handling

All methods can throw `VantigeSDKError` with specific error codes:

```typescript
try {
  const response = await client.query({
    corpusId: 'docs',
    query: 'test'
  });
} catch (error) {
  if (error instanceof VantigeSDKError) {
    switch (error.code) {
      case 401:
        console.error('Invalid API key');
        break;
      case 404:
        console.error('Knowledge base not found');
        break;
      case 429:
        console.error('Rate limited');
        break;
    }
  }
}
```

## Type Definitions

### VantigeClientConfig

```typescript
interface VantigeClientConfig {
  apiKey: string;
  baseUrl?: string;
}
```

### QueryParams

```typescript
interface QueryParams {
  corpusId: string;
  query: string;
  limit?: number;
  generateAnswer?: boolean;
}
```