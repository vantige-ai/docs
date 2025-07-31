---
sidebar_position: 3
---

# Error Handling

The Vantige AI SDK provides comprehensive error handling with typed errors and helpful messages. This guide covers how to handle errors effectively in your application.

## Error Types

All SDK errors extend the base `VantigeSDKError` class:

```typescript
import { VantigeSDKError } from '@vantige-ai/typescript-sdk';

try {
  const result = await client.query({ corpusId: 'docs', query: 'test' });
} catch (error) {
  if (error instanceof VantigeSDKError) {
    console.error(`Error ${error.code}: ${error.message}`);
    console.error('Details:', error.details);
  }
}
```

## Common Error Codes

### Authentication Errors

#### 401 - Unauthorized
```typescript
// Invalid or missing API key
{
  code: 401,
  message: "Invalid API key",
  details: { error: "The provided API key is invalid or has been revoked" }
}
```

#### 403 - Forbidden
```typescript
// Missing required scope
{
  code: 403,
  message: "Forbidden",
  details: { error: "API key is missing required scope: knowledgebase:read" }
}
```

### Resource Errors

#### 404 - Not Found
```typescript
// Knowledge base not found
{
  code: 404,
  message: "Not Found",
  details: { error: "Knowledge base 'invalid-id' not found" }
}
```

### Rate Limiting

#### 429 - Too Many Requests
```typescript
// Rate limit exceeded
{
  code: 429,
  message: "Too Many Requests",
  details: { 
    error: "Rate limit exceeded",
    retryAfter: 60 // seconds
  }
}
```

### Validation Errors

#### 400 - Bad Request
```typescript
// Invalid request parameters
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

## Error Handling Patterns

### Basic Error Handling

```typescript
try {
  const response = await client.query({
    corpusId: 'docs',
    query: 'What is Vantige?'
  });
  // Process response
} catch (error) {
  if (error instanceof VantigeSDKError) {
    // Handle SDK-specific errors
    switch (error.code) {
      case 401:
        console.error('Invalid API key');
        break;
      case 404:
        console.error('Knowledge base not found');
        break;
      case 429:
        console.error('Rate limited, retry after:', error.details.retryAfter);
        break;
      default:
        console.error('SDK Error:', error.message);
    }
  } else {
    // Handle other errors (network, etc.)
    console.error('Unexpected error:', error);
  }
}
```

### Retry Logic

The SDK includes built-in retry logic for transient errors. You can also implement custom retry logic:

```typescript
async function queryWithRetry(
  client: VantigeClient,
  params: QueryParams,
  maxRetries = 3
): Promise<QueryResponse> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await client.query(params);
    } catch (error) {
      if (error instanceof VantigeSDKError && error.code === 429) {
        // Rate limited - wait before retry
        const waitTime = error.details.retryAfter || 60;
        if (attempt < maxRetries) {
          console.log(`Rate limited. Waiting ${waitTime}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
          continue;
        }
      }
      throw error; // Re-throw if not retryable or max retries reached
    }
  }
  throw new Error('Max retries reached');
}
```

### Graceful Degradation

```typescript
async function searchWithFallback(query: string): Promise<SearchResult> {
  try {
    // Try to get AI-generated answer
    const response = await client.query({
      corpusId: 'docs',
      query,
      generateAnswer: true
    });
    
    return {
      type: 'ai-generated',
      answer: response.answer,
      sources: response.results
    };
  } catch (error) {
    if (error instanceof VantigeSDKError && error.code === 429) {
      // Fall back to non-AI search if rate limited
      try {
        const response = await client.query({
          corpusId: 'docs',
          query,
          generateAnswer: false
        });
        
        return {
          type: 'search-only',
          results: response.results
        };
      } catch (fallbackError) {
        // Handle fallback failure
        throw fallbackError;
      }
    }
    throw error;
  }
}
```

## Logging and Monitoring

### Structured Logging

```typescript
import { VantigeSDKError } from '@vantige-ai/typescript-sdk';

function logError(error: unknown, context: Record<string, any>) {
  if (error instanceof VantigeSDKError) {
    console.error({
      timestamp: new Date().toISOString(),
      level: 'error',
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
      context
    });
  } else {
    console.error({
      timestamp: new Date().toISOString(),
      level: 'error',
      error: error instanceof Error ? error.message : String(error),
      context
    });
  }
}

// Usage
try {
  await client.query({ corpusId: 'docs', query: 'test' });
} catch (error) {
  logError(error, { 
    operation: 'query',
    corpusId: 'docs',
    userId: currentUser.id 
  });
}
```

### Error Reporting

```typescript
// Example with Sentry
import * as Sentry from '@sentry/node';

try {
  await client.query({ corpusId: 'docs', query: 'test' });
} catch (error) {
  if (error instanceof VantigeSDKError) {
    Sentry.captureException(error, {
      tags: {
        errorCode: error.code,
        sdkVersion: '@vantige-ai/typescript-sdk'
      },
      extra: error.details
    });
  }
  throw error;
}
```

## Best Practices

1. **Always catch VantigeSDKError**: Check if the error is an instance of `VantigeSDKError` before accessing SDK-specific properties

2. **Log error details**: The `details` property contains valuable debugging information

3. **Implement retry logic**: Handle transient errors like rate limiting gracefully

4. **Provide user-friendly messages**: Map error codes to user-friendly messages

5. **Monitor error rates**: Track error frequencies to identify issues early

## Next Steps

- [API Reference](./api/client) - See all possible errors for each method
- [Examples](./examples/error-handling) - See error handling in real-world scenarios
- [Authentication](./authentication) - Learn about authentication-specific errors