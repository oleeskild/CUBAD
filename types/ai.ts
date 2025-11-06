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
  resourceGroup?: string
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

export interface ArtifactDefinition {
  id: string
  name: string
  description: string
  collectionContext: {
    accountName: string
    resourceGroup?: string
    databaseName: string
    containerName: string
  }
  code: string // React component code
  query?: string // Optional Cosmos query to fetch data
  dependencies?: string[] // External libraries needed
  createdAt: string
  updatedAt: string
  version: number
}

export interface GenerateArtifactRequest {
  prompt: string
  context: AIQueryContext
  provider: AIProviderConfig
  sampleData?: any[] // Sample documents to inform generation
  existingArtifact?: ArtifactDefinition // For refinement/modification
  refinementPrompt?: string // What to change about the existing artifact
}

export interface GenerateArtifactResponse {
  artifact: ArtifactDefinition
  explanation: string
}

// Export/Import types
export interface ArtifactExportData {
  version: string // Export format version
  exportedAt: string
  exportType: 'single' | 'batch' | 'container'
  artifacts: ExportedArtifact[]
  metadata?: {
    originalEnvironment?: string
    description?: string
    tags?: string[]
  }
}

export interface ExportedArtifact {
  artifact: ArtifactDefinition
  originalId?: string // Keep original ID for reference
  exportMetadata?: {
    originalContainer?: ContainerArtifactKey
    versionHistory?: boolean // Whether this includes all versions
  }
}

export interface ContainerArtifactKey {
  accountName: string
  resourceGroup?: string
  databaseName: string
  containerName: string
}

export interface ImportOptions {
  preserveIds?: boolean // Whether to keep original IDs or generate new ones
  preserveVersions?: boolean // Whether to keep original version numbers
  overwriteExisting?: boolean // Whether to overwrite artifacts with same name
  targetContainer?: ContainerArtifactKey // Override target container
  validateCode?: boolean // Whether to validate React code before import (default: false)
}

export interface ImportResult {
  success: boolean
  importedArtifacts: Array<{
    originalId?: string
    newId: string
    name: string
    status: 'imported' | 'updated' | 'skipped' | 'error'
    error?: string
  }>
  errors: string[]
  warnings: string[]
  summary: {
    total: number
    imported: number
    updated: number
    skipped: number
    errors: number
  }
}
