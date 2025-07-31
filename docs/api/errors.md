---
sidebar_position: 3
---

# Error Reference

Complete error reference for the Vantige AI TypeScript SDK.

## Error Class

All SDK errors extend the `VantigeSDKError` class:

```typescript
class VantigeSDKError extends Error {
  code: number;                  // HTTP status code
  details: Record<string, any>;  // Additional error context
  
  constructor(code: number, message: string, details?: Record<string, any>);
}
```

## Error Codes

### 400 - Bad Request

Invalid request parameters or validation errors.

```typescript
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

**Common Causes:**
- Empty query string
- Invalid limit value (not between 1-100)
- Missing required parameters
- Invalid parameter types

**Example:**
```typescript
try {
  await client.query({
    corpusId: 'docs',
    query: '',  // Empty query
    limit: 200  // Exceeds maximum
  });
} catch (error) {
  // error.code === 400
  // error.details.fields shows specific validation errors
}
```

### 401 - Unauthorized

Invalid or missing API key.

```typescript
{
  code: 401,
  message: "Invalid API key",
  details: {
    error: "The provided API key is invalid or has been revoked"
  }
}
```

**Common Causes:**
- API key not provided
- API key revoked or expired
- Malformed API key
- Using test key in production or vice versa

**Example:**
```typescript
const client = new VantigeClient({
  apiKey: 'invalid_key'
});

try {
  await client.listKnowledgeBases();
} catch (error) {
  // error.code === 401
}
```

### 403 - Forbidden

API key lacks required permissions.

```typescript
{
  code: 403,
  message: "Forbidden",
  details: {
    error: "API key is missing required scope: knowledgebase:read"
  }
}
```

**Common Causes:**
- API key missing `knowledgebase:read` scope
- Attempting to access restricted resources
- Organization-level restrictions

**Resolution:**
1. Check API key scopes in dashboard
2. Request necessary permissions
3. Generate new key with correct scopes

### 404 - Not Found

Requested resource doesn't exist.

```typescript
{
  code: 404,
  message: "Not Found",
  details: {
    error: "Knowledge base 'invalid-corpus-id' not found"
  }
}
```

**Common Causes:**
- Invalid corpus ID
- Knowledge base deleted
- No access to the knowledge base

**Example:**
```typescript
try {
  await client.query({
    corpusId: 'non-existent-kb',
    query: 'test'
  });
} catch (error) {
  // error.code === 404
}
```

### 429 - Too Many Requests

Rate limit exceeded.

```typescript
{
  code: 429,
  message: "Too Many Requests",
  details: {
    error: "Rate limit exceeded",
    retryAfter: 60  // seconds to wait
  }
}
```

**Common Causes:**
- Too many requests in short time
- Exceeding plan limits
- Concurrent request limits

**Handling:**
```typescript
async function queryWithBackoff(params: QueryParams) {
  try {
    return await client.query(params);
  } catch (error) {
    if (error.code === 429) {
      const waitTime = error.details.retryAfter || 60;
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
      return queryWithBackoff(params); // Retry
    }
    throw error;
  }
}
```

### 500 - Internal Server Error

Server-side error.

```typescript
{
  code: 500,
  message: "Internal Server Error",
  details: {
    error: "An unexpected error occurred",
    requestId: "req_123abc"  // For support reference
  }
}
```

**Common Causes:**
- Temporary server issues
- Service maintenance
- Unexpected server errors

**Recommended Action:**
- Retry with exponential backoff
- Contact support if persistent
- Include requestId in support tickets

### 503 - Service Unavailable

Service temporarily unavailable.

```typescript
{
  code: 503,
  message: "Service Unavailable",
  details: {
    error: "Service is temporarily unavailable",
    retryAfter: 30
  }
}
```

**Common Causes:**
- Scheduled maintenance
- Service deployment
- Temporary outages

## Error Handling Best Practices

### 1. Type-Safe Error Handling

```typescript
import { VantigeSDKError, isVantigeSDKError } from '@vantige-ai/typescript-sdk';

try {
  const result = await client.query(params);
} catch (error) {
  if (isVantigeSDKError(error)) {
    // TypeScript knows error is VantigeSDKError
    handleSDKError(error);
  } else {
    // Handle other errors (network, etc.)
    handleGenericError(error);
  }
}
```

### 2. Error-Specific Handling

```typescript
function handleSDKError(error: VantigeSDKError) {
  switch (error.code) {
    case 401:
      // Refresh API key or redirect to auth
      refreshAuthentication();
      break;
      
    case 429:
      // Implement backoff strategy
      scheduleRetry(error.details.retryAfter);
      break;
      
    case 404:
      // Show user-friendly message
      showError('Knowledge base not found');
      break;
      
    default:
      // Generic error handling
      logError(error);
      showError('An error occurred');
  }
}
```

### 3. Retry Strategy

```typescript
class RetryableClient {
  private client: VantigeClient;
  private maxRetries = 3;
  private baseDelay = 1000; // 1 second
  
  async queryWithRetry(params: QueryParams): Promise<QueryResponse> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await this.client.query(params);
      } catch (error) {
        lastError = error;
        
        if (!this.isRetryable(error)) {
          throw error;
        }
        
        const delay = this.calculateDelay(attempt, error);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }
  
  private isRetryable(error: any): boolean {
    if (!isVantigeSDKError(error)) return false;
    
    // Retry on rate limits and server errors
    return [429, 500, 502, 503].includes(error.code);
  }
  
  private calculateDelay(attempt: number, error: any): number {
    if (error.code === 429 && error.details?.retryAfter) {
      return error.details.retryAfter * 1000;
    }
    
    // Exponential backoff with jitter
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000;
    return exponentialDelay + jitter;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 4. Logging and Monitoring

```typescript
import { VantigeSDKError } from '@vantige-ai/typescript-sdk';

function logSDKError(error: VantigeSDKError, context: any) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    errorCode: error.code,
    errorMessage: error.message,
    errorDetails: error.details,
    context,
    stack: error.stack
  };
  
  // Send to logging service
  logger.error('Vantige SDK Error', errorLog);
  
  // Send to monitoring service
  if (error.code >= 500) {
    alerting.notify('Vantige API Error', errorLog);
  }
}
```