---
sidebar_position: 2
---

# Type Definitions

Complete type definitions for the Vantige AI TypeScript SDK.

## Client Types

### VantigeClientConfig

Configuration options for the VantigeClient.

```typescript
interface VantigeClientConfig {
  apiKey: string;      // Your Vantige API key (required)
  baseUrl?: string;    // Custom API endpoint (optional)
}
```

## Knowledge Base Types

### KnowledgeBase

Represents a knowledge base in your organization.

```typescript
interface KnowledgeBase {
  corpusId: string;    // Unique identifier for the knowledge base
  name: string;        // Human-readable name
  description: string; // Description of the knowledge base contents
  createdAt: string;   // ISO 8601 timestamp
  updatedAt: string;   // ISO 8601 timestamp
}
```

## Query Types

### QueryParams

Parameters for querying a knowledge base.

```typescript
interface QueryParams {
  corpusId: string;         // ID of the knowledge base to query
  query: string;            // The search query
  limit?: number;           // Max results (1-100, default: 10)
  generateAnswer?: boolean; // Generate AI answer (default: false)
}
```

### QueryResponse

Response from a query operation.

```typescript
interface QueryResponse {
  results: SearchResult[];  // Array of search results
  answer?: string;          // AI-generated answer (if requested)
  queryId: string;          // Unique identifier for this query
  corpusId: string;         // The knowledge base that was queried
}
```

### SearchResult

Individual search result from a query.

```typescript
interface SearchResult {
  id: string;                    // Unique identifier for the result
  title: string;                 // Title of the document/chunk
  content: string;               // Content excerpt
  url?: string;                  // Optional URL to the source
  score: number;                 // Relevance score (0-1)
  metadata: Record<string, any>; // Additional metadata
}
```

## Error Types

### VantigeSDKError

Base error class for all SDK errors.

```typescript
class VantigeSDKError extends Error {
  code: number;                  // HTTP status code
  details: Record<string, any>;  // Additional error details
  
  constructor(code: number, message: string, details?: Record<string, any>);
}
```

### Common Error Details

```typescript
// 401 Unauthorized
{
  code: 401,
  message: "Invalid API key",
  details: {
    error: "The provided API key is invalid or has been revoked"
  }
}

// 403 Forbidden
{
  code: 403,
  message: "Forbidden",
  details: {
    error: "API key is missing required scope: knowledgebase:read"
  }
}

// 404 Not Found
{
  code: 404,
  message: "Not Found",
  details: {
    error: "Knowledge base 'corpus-id' not found"
  }
}

// 429 Too Many Requests
{
  code: 429,
  message: "Too Many Requests",
  details: {
    error: "Rate limit exceeded",
    retryAfter: 60  // seconds
  }
}

// 400 Bad Request
{
  code: 400,
  message: "Bad Request",
  details: {
    error: "Validation failed",
    fields: {
      query: "Query cannot be empty",
      limit: "Limit must be between 1 and 100"
    }
  }
}
```

## Utility Types

### APIResponse\<T\>

Generic wrapper for API responses (internal use).

```typescript
interface APIResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}
```

### RequestOptions

Options for HTTP requests (internal use).

```typescript
interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: any;
  headers?: Record<string, string>;
}
```

## Type Guards

The SDK provides type guards for runtime type checking:

```typescript
import { isVantigeSDKError } from '@vantige-ai/typescript-sdk';

try {
  await client.query({ corpusId: 'docs', query: 'test' });
} catch (error) {
  if (isVantigeSDKError(error)) {
    // TypeScript knows error is VantigeSDKError
    console.log('Error code:', error.code);
  }
}
```

## Validation

All input parameters are validated using Zod schemas:

```typescript
// Query parameters are validated before sending
const QueryParamsSchema = z.object({
  corpusId: z.string().min(1),
  query: z.string().min(1),
  limit: z.number().int().min(1).max(100).optional(),
  generateAnswer: z.boolean().optional()
});
```