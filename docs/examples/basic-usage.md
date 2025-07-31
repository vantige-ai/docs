---
sidebar_position: 1
---

# Basic Usage

Simple examples to get you started with the Vantige AI TypeScript SDK.

## Setup

First, install the SDK and set up your environment:

```bash
npm install @vantige-ai/typescript-sdk
```

Create a `.env` file:
```bash
VANTIGE_API_KEY=vk_test_your_api_key_here
```

## Basic Client Setup

```typescript
import { VantigeClient } from '@vantige-ai/typescript-sdk';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize the client
const client = new VantigeClient({
  apiKey: process.env.VANTIGE_API_KEY!
});
```

## List Available Knowledge Bases

```typescript
async function listKnowledgeBases() {
  try {
    const knowledgeBases = await client.listKnowledgeBases();
    
    console.log(`Found ${knowledgeBases.length} knowledge bases:\n`);
    
    knowledgeBases.forEach(kb => {
      console.log(`📚 ${kb.name}`);
      console.log(`   ID: ${kb.corpusId}`);
      console.log(`   Description: ${kb.description}`);
      console.log(`   Last updated: ${new Date(kb.updatedAt).toLocaleDateString()}\n`);
    });
  } catch (error) {
    console.error('Error listing knowledge bases:', error.message);
  }
}
```

## Simple Search Query

```typescript
async function searchDocumentation() {
  try {
    const response = await client.query({
      corpusId: 'docs',
      query: 'How do I authenticate with the API?',
      limit: 5
    });
    
    console.log(`Found ${response.results.length} results:\n`);
    
    response.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`);
      console.log(`   Score: ${(result.score * 100).toFixed(1)}%`);
      console.log(`   ${result.content.substring(0, 150)}...`);
      if (result.url) {
        console.log(`   URL: ${result.url}`);
      }
      console.log();
    });
  } catch (error) {
    console.error('Search error:', error.message);
  }
}
```

## Query with AI-Generated Answer

```typescript
async function askQuestion() {
  try {
    const response = await client.query({
      corpusId: 'support',
      query: 'What is your refund policy?',
      generateAnswer: true,
      limit: 3
    });
    
    if (response.answer) {
      console.log('🤖 AI Answer:');
      console.log(response.answer);
      console.log('\n📄 Sources:');
      
      response.results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.title}`);
      });
    } else {
      console.log('No AI answer generated. Results:');
      response.results.forEach(result => {
        console.log(`- ${result.title}`);
      });
    }
  } catch (error) {
    console.error('Query error:', error.message);
  }
}
```

## Complete Example Script

```typescript
import { VantigeClient, VantigeSDKError } from '@vantige-ai/typescript-sdk';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  // Initialize client
  const client = new VantigeClient({
    apiKey: process.env.VANTIGE_API_KEY!
  });
  
  console.log('🚀 Vantige AI SDK Example\n');
  
  try {
    // Step 1: List available knowledge bases
    console.log('1️⃣ Listing knowledge bases...\n');
    const knowledgeBases = await client.listKnowledgeBases();
    
    if (knowledgeBases.length === 0) {
      console.log('No knowledge bases found. Please create one first.');
      return;
    }
    
    const firstKb = knowledgeBases[0];
    console.log(`Using knowledge base: ${firstKb.name} (${firstKb.corpusId})\n`);
    
    // Step 2: Perform a search
    console.log('2️⃣ Searching for "getting started"...\n');
    const searchResponse = await client.query({
      corpusId: firstKb.corpusId,
      query: 'getting started',
      limit: 3
    });
    
    console.log(`Found ${searchResponse.results.length} results`);
    searchResponse.results.forEach((result, i) => {
      console.log(`${i + 1}. ${result.title} (${(result.score * 100).toFixed(0)}% match)`);
    });
    
    // Step 3: Ask a question with AI
    console.log('\n3️⃣ Asking a question with AI...\n');
    const aiResponse = await client.query({
      corpusId: firstKb.corpusId,
      query: 'What are the main features?',
      generateAnswer: true,
      limit: 5
    });
    
    if (aiResponse.answer) {
      console.log('Answer:', aiResponse.answer);
      console.log(`\nBased on ${aiResponse.results.length} sources`);
    }
    
  } catch (error) {
    if (error instanceof VantigeSDKError) {
      console.error(`❌ SDK Error ${error.code}: ${error.message}`);
      if (error.details) {
        console.error('Details:', error.details);
      }
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

// Run the example
main();
```

## Running the Examples

Save any of these examples to a file (e.g., `example.ts`) and run:

```bash
# Using ts-node
npx ts-node example.ts

# Or compile and run
npx tsc example.ts
node example.js
```

## Next Steps

- Check out [Advanced Queries](./advanced-queries) for more complex examples
- Learn about [Error Handling](./error-handling) patterns
- See the [API Reference](../api/client) for all available options