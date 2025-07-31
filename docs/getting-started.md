---
sidebar_position: 1
---

# Getting Started

Welcome to the Vantige AI TypeScript SDK documentation. This guide will help you get up and running with our SDK in minutes.

## Installation

Install the SDK using your preferred package manager:

```bash npm2yarn
npm install @vantige-ai/typescript-sdk
```

## Quick Start

### 1. Import and Initialize

```typescript
import { VantigeClient } from '@vantige-ai/typescript-sdk';

const client = new VantigeClient({
  apiKey: process.env.VANTIGE_API_KEY // Required: vk_test_... or vk_live_...
});
```

### 2. List Knowledge Bases

```typescript
const knowledgeBases = await client.listKnowledgeBases();

console.log('Available Knowledge Bases:');
knowledgeBases.forEach(kb => {
  console.log(`- ${kb.name} (ID: ${kb.corpusId})`);
});
```

### 3. Query a Knowledge Base

```typescript
const response = await client.query({
  corpusId: 'hr-policies',
  query: 'What is the vacation policy?',
  generateAnswer: true
});

console.log('Answer:', response.answer);
console.log('Sources:', response.results.map(r => r.title));
```

## Environment Setup

### API Keys

You'll need a Vantige API key to use the SDK. API keys come in two types:

- **Test Keys** (`vk_test_...`): Connect to the test environment
- **Live Keys** (`vk_live_...`): Connect to the production environment

Store your API key securely in environment variables:

```bash
# .env file
VANTIGE_API_KEY=vk_test_your_api_key_here
```

### TypeScript Configuration

The SDK is written in TypeScript and includes comprehensive type definitions. No additional setup is required for TypeScript projects.

## Next Steps

- [Authentication Guide](./authentication) - Learn about API key management and security
- [API Reference](./api/client) - Explore all available methods and options
- [Examples](./examples/basic-usage) - See real-world usage examples
- [Error Handling](./error-handling) - Learn how to handle errors gracefully