export type AIProviderType = 'anthropic' | 'openrouter' | 'ollama' | 'azure-openai'

export interface AIProviderConfig {
  type: AIProviderType
  apiKey?: string
  endpoint?: string // For Azure OpenAI and Ollama
  model?: string
  deploymentName?: string // For Azure OpenAI
}

export interface AIQueryContext {
  containerName: string
  databaseName: string
  accountName: string
  partitionKey?: string
  sampleDocuments?: any[]
}

export interface AIAssistRequest {
  prompt: string
  context: AIQueryContext
  provider: AIProviderConfig
}

export interface AIAssistResponse {
  query: string
  explanation: string
  confidence?: number
}

export interface AIProvider {
  generateQuery(prompt: string, context: AIQueryContext): Promise<AIAssistResponse>
  explainQuery(query: string, context: AIQueryContext): Promise<string>
}
