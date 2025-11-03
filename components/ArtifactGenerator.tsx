'use client'

import { useState, useEffect } from 'react'
import { getSelectedProvider } from '@/lib/storage/ai-settings'
import { AIQueryContext, ArtifactDefinition } from '@/types/ai'

interface ArtifactGeneratorProps {
  context: AIQueryContext
  currentData?: any[]
  onArtifactGenerated: (artifact: ArtifactDefinition) => void
  onClose: () => void
}

export default function ArtifactGenerator({
  context,
  currentData,
  onArtifactGenerated,
  onClose,
}: ArtifactGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, loading])

  async function handleGenerate() {
    const provider = getSelectedProvider()

    if (!provider) {
      setError('No AI provider configured. Please configure one in Settings.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/artifact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim() || 'Create the best visualization for this data',
          context,
          provider,
          sampleData: currentData && currentData.length > 0 ? [currentData[0]] : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate artifact')
      }

      onArtifactGenerated(data.artifact)
      setPrompt('')
    } catch (err: any) {
      console.error('Artifact generation error:', err)
      setError(err.message || 'Failed to generate artifact')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleGenerate()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
              Generate Artifact
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              Create a custom UI to visualize your data
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-white">
        <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🪄</span>
            <h4 className="text-sm font-semibold text-purple-900">AI-Powered Generation</h4>
          </div>
          <p className="text-xs text-purple-700">
            The AI will analyze your document structure and create the perfect visualization automatically.
            Just describe what you want or leave it empty for the best result.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-900 mb-2">
            Describe what you want to visualize <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Leave empty to let AI decide the best visualization, or provide specific instructions like 'Make it colorful' or 'Add search functionality'..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            rows={5}
          />
          <p className="text-xs text-gray-500 mt-1">
            Press ⌘+Enter or Ctrl+Enter to generate
          </p>
        </div>

        {currentData && currentData.length > 0 && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-700">
              <strong>Data Available:</strong> {currentData.length} document(s) from current query
              results will be used as sample data for the artifact.
            </p>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating Artifact...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Generate Artifact
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 bg-white">
        <p className="text-xs text-gray-500">
          Container: <span className="font-mono font-semibold">{context.containerName}</span>
        </p>
      </div>
    </div>
  )
}
