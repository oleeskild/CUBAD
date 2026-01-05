'use client'

import { useState } from 'react'
import Editor from '@monaco-editor/react'

interface ResultsViewProps {
  results: any[] | null
  metadata: {
    count: number
    requestCharge: number
    executionTime: number
  } | null
  error: string | null
}

function formatTimestamp(ts: number): string {
  try {
    return new Date(ts * 1000).toLocaleString()
  } catch {
    return String(ts)
  }
}

function truncateId(id: string, maxLength: number = 20): string {
  if (!id || id.length <= maxLength) return id
  return id.substring(0, maxLength) + '...'
}

export default function ResultsView({ results, metadata, error }: ResultsViewProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [filter, setFilter] = useState('')

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

  const copyDocumentToClipboard = (item: any, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(JSON.stringify(item, null, 2))
  }

  const filteredResults = results?.filter((item) => {
    if (!filter.trim()) return true
    const searchTerm = filter.toLowerCase()
    const jsonString = JSON.stringify(item).toLowerCase()
    return jsonString.includes(searchTerm)
  }) || []

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
              <strong className="text-gray-900 dark:text-gray-100">
                {filter ? `${filteredResults.length} / ${metadata.count}` : metadata.count}
              </strong> documents
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-gray-100">{metadata.requestCharge.toFixed(2)}</strong> RU
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-gray-100">{metadata.executionTime}</strong> ms
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter documents..."
                className="pl-8 pr-8 py-1 text-sm w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400"
              />
              {filter && (
                <button
                  onClick={() => setFilter('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
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
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-950">
        {filteredResults.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {filter ? 'No documents match your filter' : 'Query returned no results'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredResults.map((item, index) => {
              const docId = item.id || item._id || `Document ${index + 1}`
              const docName = item.name || null
              const timestamp = item._ts ? formatTimestamp(item._ts) : null
              const isEven = index % 2 === 0

              return (
                <div
                  key={index}
                  className={`rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-800 ${
                    isEven
                      ? 'bg-white dark:bg-gray-900'
                      : 'bg-gray-50 dark:bg-gray-900/50'
                  }`}
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-gray-900 dark:text-gray-100 ${
                      isEven
                        ? 'bg-white dark:bg-gray-900'
                        : 'bg-gray-50 dark:bg-gray-900/50'
                    }`}
                  >
                    <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide">
                          id
                        </span>
                        <span className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate" title={docId}>
                          {truncateId(docId, 36)}
                        </span>
                      </div>
                      {docName && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-500 tracking-wide">
                            Name
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate" title={docName}>
                            {truncateId(docName, 50)}
                          </span>
                        </div>
                      )}
                      {timestamp && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-500 tracking-wide">
                            Timestamp
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {timestamp}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={(e) => copyDocumentToClipboard(item, e)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                        title="Copy document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${
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
                    </div>
                  </button>

                  {expandedItems.has(index) && (
                    <div className="border-t border-gray-200 dark:border-gray-800">
                      <Editor
                        height="400px"
                        defaultLanguage="json"
                        value={JSON.stringify(item, null, 2)}
                        theme="vs-dark"
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          fontSize: 12,
                          lineNumbers: 'on',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          wordWrap: 'off',
                          folding: true,
                          foldingHighlight: true,
                          showFoldingControls: 'always',
                          scrollbar: {
                            vertical: 'auto',
                            horizontal: 'auto',
                          },
                          find: {
                            addExtraSpaceOnTop: false,
                            autoFindInSelection: 'never',
                            seedSearchStringFromSelection: 'never',
                          },
                        }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
