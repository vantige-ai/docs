---
sidebar_position: 2
---

# Authentication

The Vantige AI SDK uses API key authentication. This guide covers how to obtain, manage, and use API keys securely.

## API Key Types

Vantige provides two types of API keys:

### Test Keys (`vk_test_...`)
- Connect to the test environment
- Safe for development and testing
- No charges for API usage
- Limited rate limits

### Live Keys (`vk_live_...`)
- Connect to the production environment
- Used for production applications
- Usage is metered and billed
- Higher rate limits

## Required Scope

All API keys must have the `knowledgebase:read` scope to use this SDK.

## Using API Keys

### Basic Usage

```typescript
import { VantigeClient } from '@vantige-ai/typescript-sdk';

const client = new VantigeClient({
  apiKey: 'vk_test_your_api_key_here'
});
```

### Environment Variables (Recommended)

For security, always use environment variables:

```typescript
const client = new VantigeClient({
  apiKey: process.env.VANTIGE_API_KEY
});
```

### Custom Base URL

You can override the API endpoint (useful for testing):

```typescript
const client = new VantigeClient({
  apiKey: process.env.VANTIGE_API_KEY,
  baseUrl: 'https://custom-api.vantige.ai'
});
```

## Security Best Practices

### 1. Never Commit API Keys

Add your `.env` file to `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env.*.local
```

### 2. Use Different Keys for Different Environments

```typescript
// config/vantige.ts
const apiKey = process.env.NODE_ENV === 'production'
  ? process.env.VANTIGE_LIVE_API_KEY
  : process.env.VANTIGE_TEST_API_KEY;

export const vantigeClient = new VantigeClient({ apiKey });
```

### 3. Rotate Keys Regularly

Implement key rotation in your application:

```typescript
// Periodically update your API keys
// Store multiple keys and rotate between them
const keys = [
  process.env.VANTIGE_API_KEY_1,
  process.env.VANTIGE_API_KEY_2
];

const currentKeyIndex = getKeyRotationIndex();
const client = new VantigeClient({
  apiKey: keys[currentKeyIndex]
});
```

### 4. Restrict Key Access

- Only grant API keys to services that need them
- Use the principle of least privilege
- Monitor API key usage regularly

## Error Handling

The SDK provides specific error types for authentication issues:

```typescript
try {
  const result = await client.query({
    corpusId: 'docs',
    query: 'How do I get started?'
  });
} catch (error) {
  if (error.code === 401) {
    console.error('Invalid API key');
  } else if (error.code === 403) {
    console.error('API key missing required scope');
  }
}
```

## Obtaining API Keys

To get your API keys:

1. Sign up at [vantige.ai](https://vantige.ai)
2. Navigate to your dashboard
3. Go to API Keys section
4. Create a new key with `knowledgebase:read` scope
5. Copy the key immediately (it won't be shown again)

## Next Steps

- [Making Queries](./api/client#query) - Learn how to query knowledge bases
- [Error Handling](./error-handling) - Handle authentication errors gracefully
- [Examples](./examples/basic-usage) - See authentication in action