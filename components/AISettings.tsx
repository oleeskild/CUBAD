'use client'

import { useState, useEffect } from 'react'
import { getAISettings, saveAISettings, AISettings } from '@/lib/storage/ai-settings'
import { AIProviderType, AIProviderConfig } from '@/types/ai'

export default function AISettingsSection() {
  const [settings, setSettings] = useState<AISettings>(getAISettings())
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [selectedProviderType, setSelectedProviderType] = useState<AIProviderType | ''>('')

  useEffect(() => {
    setSettings(getAISettings())
  }, [])

  function handleProviderChange(providerType: AIProviderType, field: string, value: string) {
    const updatedSettings = { ...settings }
    updatedSettings.providers[providerType] = {
      ...updatedSettings.providers[providerType],
      [field]: value,
    }
    setSettings(updatedSettings)
    saveAISettings(updatedSettings)
  }

  async function handleTestConnection(providerType: AIProviderType) {
    setTesting(true)
    setTestResult(null)

    try {
      const providerConfig = settings.providers[providerType]
      if (!providerConfig) {
        throw new Error('Provider not configured')
      }

      const config: AIProviderConfig = {
        type: providerType,
        ...providerConfig,
      }

      const response = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: config }),
      })

      const data = await response.json()

      if (data.success) {
        setTestResult({ success: true, message: 'Connection successful!' })
      } else {
        setTestResult({ success: false, message: data.error || 'Connection failed' })
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || 'Failed to test connection' })
    } finally {
      setTesting(false)
    }
  }

  function handleSetAsDefault(providerType: AIProviderType) {
    const providerConfig = settings.providers[providerType]
    if (!providerConfig) return

    const config: AIProviderConfig = {
      type: providerType,
      ...providerConfig,
    }

    const updatedSettings = { ...settings, selectedProvider: config }
    setSettings(updatedSettings)
    saveAISettings(updatedSettings)
  }

  const isDefault = (providerType: AIProviderType) => {
    return settings.selectedProvider?.type === providerType
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4">AI Query Assistant</h2>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Configure AI providers to help you write Cosmos DB queries using natural language.
        Choose from multiple providers based on your preferences.
      </p>

      {/* Anthropic Claude */}
      <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Anthropic Claude</h3>
          {isDefault('anthropic') && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
              Default
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">API Key</label>
            <input
              type="password"
              value={settings.providers.anthropic?.apiKey || ''}
              onChange={(e) => handleProviderChange('anthropic', 'apiKey', e.target.value)}
              placeholder="sk-ant-..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Model (optional)</label>
            <input
              type="text"
              value={settings.providers.anthropic?.model || ''}
              onChange={(e) => handleProviderChange('anthropic', 'model', e.target.value)}
              placeholder="claude-3-5-sonnet-20241022"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleTestConnection('anthropic')}
              disabled={!settings.providers.anthropic?.apiKey || testing}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-900 rounded-lg font-medium transition-colors text-sm"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={() => handleSetAsDefault('anthropic')}
              disabled={!settings.providers.anthropic?.apiKey}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Set as Default
            </button>
          </div>
        </div>
      </div>

      {/* OpenRouter */}
      <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">OpenRouter</h3>
          {isDefault('openrouter') && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
              Default
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">API Key</label>
            <input
              type="password"
              value={settings.providers.openrouter?.apiKey || ''}
              onChange={(e) => handleProviderChange('openrouter', 'apiKey', e.target.value)}
              placeholder="sk-or-..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Model (optional)</label>
            <input
              type="text"
              value={settings.providers.openrouter?.model || ''}
              onChange={(e) => handleProviderChange('openrouter', 'model', e.target.value)}
              placeholder="anthropic/claude-3.5-sonnet"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleTestConnection('openrouter')}
              disabled={!settings.providers.openrouter?.apiKey || testing}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-900 rounded-lg font-medium transition-colors text-sm"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={() => handleSetAsDefault('openrouter')}
              disabled={!settings.providers.openrouter?.apiKey}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Set as Default
            </button>
          </div>
        </div>
      </div>

      {/* Ollama */}
      <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Ollama (Local)</h3>
          {isDefault('ollama') && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
              Default
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">Endpoint</label>
            <input
              type="text"
              value={settings.providers.ollama?.endpoint || ''}
              onChange={(e) => handleProviderChange('ollama', 'endpoint', e.target.value)}
              placeholder="http://localhost:11434"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Model</label>
            <input
              type="text"
              value={settings.providers.ollama?.model || ''}
              onChange={(e) => handleProviderChange('ollama', 'model', e.target.value)}
              placeholder="llama3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleTestConnection('ollama')}
              disabled={testing}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-900 rounded-lg font-medium transition-colors text-sm"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={() => handleSetAsDefault('ollama')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Set as Default
            </button>
          </div>
        </div>
      </div>

      {/* Azure OpenAI */}
      <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Azure OpenAI</h3>
          {isDefault('azure-openai') && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
              Default
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">API Key</label>
            <input
              type="password"
              value={settings.providers['azure-openai']?.apiKey || ''}
              onChange={(e) => handleProviderChange('azure-openai', 'apiKey', e.target.value)}
              placeholder="Azure OpenAI API Key"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Endpoint</label>
            <input
              type="text"
              value={settings.providers['azure-openai']?.endpoint || ''}
              onChange={(e) => handleProviderChange('azure-openai', 'endpoint', e.target.value)}
              placeholder="https://your-resource.openai.azure.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Deployment Name</label>
            <input
              type="text"
              value={settings.providers['azure-openai']?.deploymentName || ''}
              onChange={(e) => handleProviderChange('azure-openai', 'deploymentName', e.target.value)}
              placeholder="gpt-4"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleTestConnection('azure-openai')}
              disabled={
                !settings.providers['azure-openai']?.apiKey ||
                !settings.providers['azure-openai']?.endpoint ||
                testing
              }
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-900 rounded-lg font-medium transition-colors text-sm"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={() => handleSetAsDefault('azure-openai')}
              disabled={
                !settings.providers['azure-openai']?.apiKey ||
                !settings.providers['azure-openai']?.endpoint
              }
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Set as Default
            </button>
          </div>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div
          className={`p-4 rounded-lg ${
            testResult.success
              ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
          }`}
        >
          <p
            className={`text-sm ${
              testResult.success
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }`}
          >
            {testResult.message}
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-sm mb-2">How it works</h3>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
          <li>Configure one or more AI providers with your API keys</li>
          <li>Set your preferred provider as the default</li>
          <li>Use natural language in the query editor to generate Cosmos DB queries</li>
          <li>API keys are stored locally in your browser (never sent to our servers)</li>
        </ul>
      </div>
    </div>
  )
}
