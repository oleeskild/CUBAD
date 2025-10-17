'use client'

import { useState, useEffect } from 'react'
import { getQueryHistory, clearQueryHistory, deleteQueryHistoryItem, type QueryHistoryItem } from '@/lib/storage/query-history'

interface QueryHistoryProps {
  onSelectQuery?: (query: string) => void
}

export default function QueryHistory({ onSelectQuery }: QueryHistoryProps) {
  const [history, setHistory] = useState<QueryHistoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadHistory()
  }, [])

  function loadHistory() {
    setHistory(getQueryHistory())
  }

  function handleClearHistory() {
    if (confirm('Are you sure you want to clear all query history?')) {
      clearQueryHistory()
      loadHistory()
    }
  }

  function handleDeleteItem(id: string) {
    deleteQueryHistoryItem(id)
    loadHistory()
  }

  function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

  const filteredHistory = history.filter((item) => {
    const query = searchQuery.toLowerCase()
    return (
      item.query.toLowerCase().includes(query) ||
      item.accountName.toLowerCase().includes(query) ||
      item.databaseName.toLowerCase().includes(query) ||
      item.containerName.toLowerCase().includes(query)
    )
  })

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Query History</h2>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              title="Clear all history"
            >
              Clear
            </button>
          )}
        </div>

        {/* Search bar */}
        <input
          type="text"
          placeholder="Search history..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* History list */}
      <div className="flex-1 overflow-y-auto">
        {filteredHistory.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {history.length === 0 ? 'No query history yet' : 'No matching queries'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer group"
                onClick={() => onSelectQuery?.(item.query)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex-1">
                    {item.containerName}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteItem(item.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-opacity"
                    title="Delete"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="font-mono text-xs text-gray-900 dark:text-gray-100 mb-2 line-clamp-3">
                  {item.query}
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span title={new Date(item.timestamp).toLocaleString()}>
                    {formatTimestamp(item.timestamp)}
                  </span>
                  {item.resultCount !== undefined && (
                    <span>{item.resultCount} results</span>
                  )}
                  {item.requestCharge !== undefined && (
                    <span>{item.requestCharge.toFixed(2)} RU</span>
                  )}
                  {item.executionTime !== undefined && (
                    <span>{item.executionTime}ms</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
