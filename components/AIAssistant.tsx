'use client'

import { useState } from 'react'
import { getSelectedProvider } from '@/lib/storage/ai-settings'
import { AIQueryContext } from '@/types/ai'

interface AIAssistantProps {
  context: AIQueryContext
  onInsertQuery: (query: string) => void
}

export default function AIAssistant({ context, onInsertQuery }: AIAssistantProps) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ query: string; explanation: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sampleDocumentAdded, setSampleDocumentAdded] = useState(false)
  const [loadingSample, setLoadingSample] = useState(false)
  const [contextWithSample, setContextWithSample] = useState<AIQueryContext>(context)

  async function handleGenerate() {
    const provider = getSelectedProvider()

    if (!provider) {
      setError('No AI provider configured. Please configure one in Settings.')
      return
    }

    if (!prompt.trim()) {
      setError('Please enter a description of what you want to query')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: contextWithSample,
          provider,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate query')
      }

      setResult(data)
    } catch (err: any) {
      console.error('AI assist error:', err)
      setError(err.message || 'Failed to generate query')
    } finally {
      setLoading(false)
    }
  }

  function handleInsert() {
    if (result?.query) {
      onInsertQuery(result.query)
      setPrompt('')
      setResult(null)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleGenerate()
    }
  }

  async function handleAddSampleDocument() {
    setLoadingSample(true)
    setError(null)

    try {
      // Sanitize the document by replacing values with type defaults
      const sanitizeValue = (value: any): any => {
        if (value === null || value === undefined) {
          return null
        }
        if (typeof value === 'string') {
          return '[REDACTED]'
        }
        if (typeof value === 'number') {
          return 0
        }
        if (typeof value === 'boolean') {
          return false
        }
        if (Array.isArray(value)) {
          return value.length > 0 ? [sanitizeValue(value[0])] : []
        }
        if (typeof value === 'object') {
          const sanitized: any = {}
          for (const key in value) {
            if (value.hasOwnProperty(key)) {
              sanitized[key] = sanitizeValue(value[key])
            }
          }
          return sanitized
        }
        return value
      }

      // Fetch the actual full document structure
      const docResponse = await fetch(
        `/api/query`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountName: context.accountName,
            resourceGroup: context.resourceGroup || '',
            databaseId: context.databaseName,
            containerId: context.containerName,
            query: 'SELECT TOP 1 * FROM c ORDER BY c._ts DESC'
          })
        }
      )
      const docData = await docResponse.json()

      if (docData.success && docData.results && docData.results.length > 0) {
        const sanitized = sanitizeValue(docData.results[0])
        console.log('Sanitized document added to AI context:', sanitized)
        setContextWithSample({
          ...context,
          sampleDocuments: [sanitized]
        })
        setSampleDocumentAdded(true)
      } else {
        throw new Error('No documents found in container')
      }
    } catch (err: any) {
      console.error('Failed to add sample document:', err)
      setError(err.message || 'Failed to add sample document')
    } finally {
      setLoadingSample(false)
    }
  }

  return (
    <div className="flex flex-col h-full border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          AI Query Assistant
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Describe what you want to query in natural language
        </p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {/* Sample Document Button */}
        <div className="mb-4">
          <button
            onClick={handleAddSampleDocument}
            disabled={loadingSample || sampleDocumentAdded}
            className={`w-full px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              sampleDocumentAdded
                ? 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {loadingSample ? (
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
                Loading...
              </>
            ) : sampleDocumentAdded ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Document Schema Added
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Add Document Schema
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Adds a sanitized document structure (values redacted) to help AI understand your data
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium mb-2">What do you want to find?</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Get all documents where status is 'active' and created in the last 30 days"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Press ⌘+Enter or Ctrl+Enter to generate
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
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
              Generating...
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
              Generate Query
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <h4 className="text-xs font-semibold text-green-800 dark:text-green-200 mb-2">
                Generated Query
              </h4>
              <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded border border-green-300 dark:border-green-700 overflow-x-auto font-mono">
                {result.query}
              </pre>
            </div>

            {result.explanation && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Explanation
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-300">{result.explanation}</p>
              </div>
            )}

            <button
              onClick={handleInsert}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Insert into Editor
            </button>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Container: <span className="font-mono font-semibold">{context.containerName}</span>
        </p>
      </div>
    </div>
  )
}
