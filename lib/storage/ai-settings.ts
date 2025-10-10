import { AIProviderConfig } from '@/types/ai'

const AI_SETTINGS_KEY = 'cubad-ai-settings'

export interface AISettings {
  selectedProvider: AIProviderConfig | null
  providers: {
    anthropic?: Partial<AIProviderConfig>
    openrouter?: Partial<AIProviderConfig>
    ollama?: Partial<AIProviderConfig>
    'azure-openai'?: Partial<AIProviderConfig>
  }
}

const defaultSettings: AISettings = {
  selectedProvider: null,
  providers: {},
}

export function getAISettings(): AISettings {
  if (typeof window === 'undefined') return defaultSettings

  try {
    const stored = localStorage.getItem(AI_SETTINGS_KEY)
    if (!stored) return defaultSettings
    return JSON.parse(stored)
  } catch (error) {
    console.error('Failed to load AI settings:', error)
    return defaultSettings
  }
}

export function saveAISettings(settings: AISettings): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save AI settings:', error)
  }
}

export function updateProviderConfig(
  providerType: keyof AISettings['providers'],
  config: Partial<AIProviderConfig>
): void {
  const settings = getAISettings()
  settings.providers[providerType] = config
  saveAISettings(settings)
}

export function setSelectedProvider(config: AIProviderConfig | null): void {
  const settings = getAISettings()
  settings.selectedProvider = config
  saveAISettings(settings)
}

export function getSelectedProvider(): AIProviderConfig | null {
  const settings = getAISettings()
  return settings.selectedProvider
}
