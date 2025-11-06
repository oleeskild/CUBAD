'use client'

import { useState } from 'react'
import { getSelectedProvider } from '@/lib/storage/ai-settings'
import { AIQueryContext, ArtifactDefinition } from '@/types/ai'

interface ArtifactEditorProps {
  artifact: ArtifactDefinition
  context: AIQueryContext
  currentData?: any[]
  onArtifactUpdated: (artifact: ArtifactDefinition) => void
  onCancel: () => void
}

export default function ArtifactEditor({
  artifact,
  context,
  currentData,
  onArtifactUpdated,
  onCancel,
}: ArtifactEditorProps) {
  const [refinementPrompt, setRefinementPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRefine() {
    const provider = getSelectedProvider()

    if (!provider) {
      setError('No AI provider configured. Please configure one in Settings.')
      return
    }

    if (!refinementPrompt.trim()) {
      setError('Please describe what you want to change')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/artifact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: '', // Not used for refinement
          context,
          provider,
          existingArtifact: artifact,
          refinementPrompt: refinementPrompt.trim(),
          sampleData: currentData && currentData.length > 0 ? [currentData[0]] : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refine artifact')
      }

      onArtifactUpdated(data.artifact)
      setRefinementPrompt('')
    } catch (err: any) {
      console.error('Artifact refinement error:', err)
      setError(err.message || 'Failed to refine artifact')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleRefine()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Artifact
        </h3>
        <p className="text-xs text-gray-600 mt-1">
          Refine and improve your artifact
        </p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-white">
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Current:</strong> {artifact.name} (v{artifact.version})
          </p>
          <p className="text-xs text-blue-600 mt-1">{artifact.description}</p>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-900 mb-2">
            What would you like to change?
          </label>
          <textarea
            value={refinementPrompt}
            onChange={(e) => setRefinementPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Make the cards bigger, add color coding by status, show timestamps in a more readable format, add sorting functionality..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            rows={6}
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">
            Press ⌘+Enter or Ctrl+Enter to apply changes
          </p>
        </div>

        {currentData && currentData.length > 0 && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-700">
              <strong>Data Available:</strong> {currentData.length} document(s) will be used to preview changes
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleRefine}
            disabled={loading || !refinementPrompt.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
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
                Refining...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Apply Changes
              </>
            )}
          </button>

          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors text-sm"
          >
            Cancel
          </button>
        </div>

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
