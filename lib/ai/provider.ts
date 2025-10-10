import { AIProvider, AIProviderConfig, AIQueryContext } from '@/types/ai'
import { AnthropicProvider } from './anthropic'
import { OpenRouterProvider } from './openrouter'
import { OllamaProvider } from './ollama'
import { AzureOpenAIProvider } from './azure-openai'

export function createAIProvider(config: AIProviderConfig): AIProvider {
  switch (config.type) {
    case 'anthropic':
      return new AnthropicProvider(config)
    case 'openrouter':
      return new OpenRouterProvider(config)
    case 'ollama':
      return new OllamaProvider(config)
    case 'azure-openai':
      return new AzureOpenAIProvider(config)
    default:
      throw new Error(`Unknown AI provider type: ${config.type}`)
  }
}

export function buildSystemPrompt(context: AIQueryContext): string {
  return `You are an expert in Azure Cosmos DB SQL API queries. You help users write efficient Cosmos DB queries.

Container Information:
- Container: ${context.containerName}
- Database: ${context.databaseName}
- Account: ${context.accountName}
${context.partitionKey ? `- Partition Key: ${context.partitionKey}` : ''}

${context.sampleDocuments && context.sampleDocuments.length > 0 ? `
Sample Document Structure:
${JSON.stringify(context.sampleDocuments[0], null, 2)}
` : ''}

Cosmos DB SQL Syntax Guidelines:
- Use "SELECT * FROM c" as the base query (c is the container alias)
- Filter with WHERE clause: WHERE c.property = value
- Access nested properties with dot notation: c.address.city
- Use ARRAY_CONTAINS for array matching
- Functions available: UPPER(), LOWER(), SUBSTRING(), STARTSWITH(), ENDSWITH(), CONTAINS()
- Aggregate functions: COUNT(), SUM(), AVG(), MIN(), MAX()
- ORDER BY for sorting
- OFFSET and LIMIT for pagination
- JOIN for array expansion within documents

Important:
- Always use "c" as the container alias
- All queries must be READ-ONLY (SELECT only)
- ALWAYS include "OFFSET 0 LIMIT 100" at the end of every query (this is mandatory to prevent fetching all documents)
- Optimize for Request Units (RU) cost when possible
- Use partition key in WHERE clause when possible for efficiency`
}

export function buildQueryGenerationPrompt(userPrompt: string): string {
  return `Generate a Cosmos DB SQL query based on this request:

"${userPrompt}"

Respond with ONLY a JSON object in this format:
{
  "query": "SELECT * FROM c WHERE...",
  "explanation": "This query does X by..."
}

Do not include any other text, markdown, or code blocks. Just the JSON object.`
}

export function buildQueryExplanationPrompt(query: string): string {
  return `Explain this Cosmos DB SQL query in simple terms:

${query}

Provide a clear, concise explanation of what this query does and how it works.`
}
