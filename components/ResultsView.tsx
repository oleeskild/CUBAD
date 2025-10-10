'use client'

import { useState } from 'react'

interface ResultsViewProps {
  results: any[] | null
  metadata: {
    count: number
    requestCharge: number
    executionTime: number
  } | null
  error: string | null
}

// Syntax highlighting function for JSON
function syntaxHighlight(json: string) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'text-orange-600 dark:text-orange-400' // number
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'text-blue-600 dark:text-blue-400' // key
      } else {
        cls = 'text-green-600 dark:text-green-400' // string
      }
    } else if (/true|false/.test(match)) {
      cls = 'text-purple-600 dark:text-purple-400' // boolean
    } else if (/null/.test(match)) {
      cls = 'text-red-600 dark:text-red-400' // null
    }
    return '<span class="' + cls + '">' + match + '</span>'
  })
}

export default function ResultsView({ results, metadata, error }: ResultsViewProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  const exportAsJSON = () => {
    if (!results) return
    const dataStr = JSON.stringify(results, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cosmos-query-results-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = () => {
    if (!results) return
    navigator.clipboard.writeText(JSON.stringify(results, null, 2))
  }

  if (error) {
    return (
      <div className="h-full overflow-y-auto bg-white dark:bg-gray-950 p-6">
        <div className="max-w-4xl">
          <div className="bg-red-50 dark:bg-red-950 border-2 border-red-300 dark:border-red-700 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base mb-2 text-red-900 dark:text-red-100">Query Execution Failed</h3>
                <p className="text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap break-words font-mono bg-red-100 dark:bg-red-900 p-3 rounded">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm">No results yet. Execute a query to see results.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      {/* Metadata bar */}
      {metadata && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-gray-100">{metadata.count}</strong> documents
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-gray-100">{metadata.requestCharge.toFixed(2)}</strong> RU
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-gray-100">{metadata.executionTime}</strong> ms
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              title="Copy to clipboard"
            >
              Copy
            </button>
            <button
              onClick={exportAsJSON}
              className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              title="Export as JSON"
            >
              Export JSON
            </button>
          </div>
        </div>
      )}

      {/* Results list */}
      <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-950">
        {results.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Query returned no results
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-gray-100"
                >
                  <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                    Document {index + 1}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      expandedItems.has(index) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {expandedItems.has(index) && (
                  <div className="p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
                    <pre className="text-xs font-mono overflow-x-auto">
                      <code className="text-gray-900 dark:text-gray-100" dangerouslySetInnerHTML={{ __html: syntaxHighlight(JSON.stringify(item, null, 2)) }} />
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
