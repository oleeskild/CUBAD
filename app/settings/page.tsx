'use client'

import { useState, useEffect } from 'react'
import { saveSearchIndex, getSearchIndexMetadata, clearSearchIndex } from '@/lib/db/search-index'
import {
  getDisplayFilters,
  addDisplayFilter,
  updateDisplayFilter,
  deleteDisplayFilter,
  type DisplayFilter,
} from '@/lib/storage/display-filters'
import Link from 'next/link'

export default function SettingsPage() {
  const [building, setBuilding] = useState(false)
  const [progress, setProgress] = useState<any>(null)
  const [metadata, setMetadata] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Display filters state
  const [filters, setFilters] = useState<DisplayFilter[]>([])
  const [newFilter, setNewFilter] = useState({
    name: '',
    pattern: '',
    replacement: '',
    target: 'both' as 'database' | 'container' | 'both',
  })

  useEffect(() => {
    setFilters(getDisplayFilters())
  }, [])

  async function loadMetadata() {
    const meta = await getSearchIndexMetadata()
    setMetadata(meta)
  }

  async function buildSearchIndex() {
    setBuilding(true)
    setError(null)
    setProgress({ message: 'Starting...', accountsProcessed: 0, totalAccounts: 0 })

    try {
      const response = await fetch('/api/search-index/build', {
        method: 'POST',
      })

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let finalData: any = null

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        // Append to buffer and process complete lines
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const message = JSON.parse(line)

            if (message.type === 'start') {
              setProgress({ message: message.message, accountsProcessed: 0, totalAccounts: 0 })
            } else if (message.type === 'progress') {
              setProgress({
                message: message.message,
                accountsProcessed: message.accountsProcessed || 0,
                totalAccounts: message.totalAccounts || 0,
                databasesFound: message.databasesFound || 0,
                containersFound: message.containersFound || 0,
              })
            } else if (message.type === 'error') {
              if (message.continuable) {
                // Log error but continue
                console.error('Build error:', message.message)
              } else {
                throw new Error(message.message || 'Build failed')
              }
            } else if (message.type === 'complete') {
              finalData = message
            }
          } catch (parseError) {
            console.error('Failed to parse message:', line, parseError)
          }
        }
      }

      if (!finalData) {
        throw new Error('Build did not complete successfully')
      }

      // Save to IndexedDB
      await saveSearchIndex(finalData.data)

      setProgress({
        ...finalData.progress,
        message: 'Build complete!',
      })
      await loadMetadata()
    } catch (err: any) {
      console.error('Search index build error:', err)
      setError(err.message)
      setProgress(null)
    } finally {
      setBuilding(false)
    }
  }

  async function clearIndex() {
    if (!confirm('Are you sure you want to clear the search index?')) return

    await clearSearchIndex()
    setMetadata(null)
    setProgress(null)
  }

  function handleAddFilter() {
    if (!newFilter.name || !newFilter.pattern) return

    const filter = addDisplayFilter({
      name: newFilter.name,
      pattern: newFilter.pattern,
      replacement: newFilter.replacement,
      target: newFilter.target,
      enabled: true,
    })

    setFilters([...filters, filter])
    setNewFilter({ name: '', pattern: '', replacement: '', target: 'both' })
  }

  function handleToggleFilter(id: string, enabled: boolean) {
    updateDisplayFilter(id, { enabled })
    setFilters(filters.map((f) => (f.id === id ? { ...f, enabled } : f)))
  }

  function handleDeleteFilter(id: string) {
    if (!confirm('Are you sure you want to delete this filter?')) return
    deleteDisplayFilter(id)
    setFilters(filters.filter((f) => f.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-xl font-semibold mb-4">Search Index</h2>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Build a local search index to enable fast searching across all your databases and containers.
            This will fetch data from all your Cosmos DB accounts and store it locally in your browser.
          </p>

          {metadata && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">Current Index</h3>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Last updated:</span>{' '}
                  {new Date(metadata.lastUpdated).toLocaleString()}
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Accounts:</span>{' '}
                  {metadata.totalAccounts}
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Databases:</span>{' '}
                  {metadata.totalDatabases}
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Containers:</span>{' '}
                  {metadata.totalContainers}
                </div>
              </div>
            </div>
          )}

          {progress && (
            <div className={`mb-6 p-4 rounded-lg ${
              building
                ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800'
                : 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
            }`}>
              <h3 className="font-semibold text-sm mb-2">
                {building ? 'Building Index...' : 'Build Complete!'}
              </h3>
              <div className="text-sm space-y-1">
                {progress.message && (
                  <div className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                    {progress.message}
                  </div>
                )}
                {progress.totalAccounts > 0 && (
                  <>
                    <div className="flex items-center gap-2">
                      <span>Accounts:</span>
                      <span className="font-medium">{progress.accountsProcessed || 0} / {progress.totalAccounts}</span>
                      {building && progress.totalAccounts > 0 && (
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-xs">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${((progress.accountsProcessed || 0) / progress.totalAccounts) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                    {(progress.databasesFound !== undefined) && (
                      <div>Found {progress.databasesFound} databases</div>
                    )}
                    {(progress.containersFound !== undefined) && (
                      <div>Found {progress.containersFound} containers</div>
                    )}
                  </>
                )}
                {progress.errors && progress.errors.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-yellow-600 dark:text-yellow-400">
                      {progress.errors.length} errors occurred
                    </summary>
                    <ul className="mt-2 space-y-1 text-xs">
                      {progress.errors.map((err: string, i: number) => (
                        <li key={i} className="text-red-600 dark:text-red-400">
                          {err}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <h3 className="font-semibold text-sm mb-2 text-red-800 dark:text-red-200">Error</h3>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={buildSearchIndex}
              disabled={building}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {building ? (
                <span className="flex items-center gap-2">
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
                  Building Index...
                </span>
              ) : (
                'Build Search Index'
              )}
            </button>

            {metadata && (
              <button
                onClick={loadMetadata}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                Refresh Status
              </button>
            )}

            {metadata && (
              <button
                onClick={clearIndex}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Clear Index
              </button>
            )}
          </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">How it works</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
              <li>Fetches all accounts, databases, and containers from Azure</li>
              <li>Stores the data in your browser's IndexedDB (local storage)</li>
              <li>Enables the command palette (⌘K) to search everything instantly</li>
              <li>Data persists across browser sessions</li>
              <li>Rebuild the index when you add new resources to Azure</li>
            </ul>
          </div>
        </div>

        {/* Display Filters Section */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Display Name Filters</h2>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Use regex patterns to clean up database and container names in the UI. For example, remove common
            suffixes like "ReadModelEntity" or prefixes like "Service.Company.*-".
          </p>

          {/* Add New Filter */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-sm mb-3">Add New Filter</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium mb-1">Filter Name</label>
                <input
                  type="text"
                  value={newFilter.name}
                  onChange={(e) => setNewFilter({ ...newFilter, name: e.target.value })}
                  placeholder="e.g., Remove ReadModelEntity"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Apply To</label>
                <select
                  value={newFilter.target}
                  onChange={(e) => setNewFilter({ ...newFilter, target: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                >
                  <option value="both">Both Databases & Containers</option>
                  <option value="database">Databases Only</option>
                  <option value="container">Containers Only</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Regex Pattern</label>
                <input
                  type="text"
                  value={newFilter.pattern}
                  onChange={(e) => setNewFilter({ ...newFilter, pattern: e.target.value })}
                  placeholder="e.g., ReadModelEntity$"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Replacement</label>
                <input
                  type="text"
                  value={newFilter.replacement}
                  onChange={(e) => setNewFilter({ ...newFilter, replacement: e.target.value })}
                  placeholder="Leave empty to remove"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono"
                />
              </div>
            </div>
            <button
              onClick={handleAddFilter}
              disabled={!newFilter.name || !newFilter.pattern}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Add Filter
            </button>
          </div>

          {/* Existing Filters */}
          {filters.length > 0 ? (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm mb-3">Active Filters ({filters.length})</h3>
              {filters.map((filter) => (
                <div
                  key={filter.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <input
                    type="checkbox"
                    checked={filter.enabled}
                    onChange={(e) => handleToggleFilter(filter.id, e.target.checked)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{filter.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
                      Pattern: <span className="text-blue-600 dark:text-blue-400">{filter.pattern}</span>
                      {' → '}
                      Replacement: <span className="text-green-600 dark:text-green-400">
                        {filter.replacement || '(empty)'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Applies to: {filter.target === 'both' ? 'Databases & Containers' : filter.target === 'database' ? 'Databases' : 'Containers'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFilter(filter.id)}
                    className="px-3 py-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">
              No filters yet. Add one above to get started.
            </div>
          )}

          {/* Examples */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">Example Filters</h3>
            <div className="text-xs text-gray-700 dark:text-gray-300 space-y-2">
              <div>
                <strong>Remove "ReadModelEntity" suffix:</strong>
                <br />
                Pattern: <code className="bg-white dark:bg-gray-900 px-1 py-0.5 rounded">ReadModelEntity$</code>
                <br />
                Replacement: <code className="bg-white dark:bg-gray-900 px-1 py-0.5 rounded">(empty)</code>
              </div>
              <div>
                <strong>Remove "Service.Company.{'{AnyWord}'}-" prefix:</strong>
                <br />
                Pattern: <code className="bg-white dark:bg-gray-900 px-1 py-0.5 rounded">^Service\.Company\.\w+-</code>
                <br />
                Replacement: <code className="bg-white dark:bg-gray-900 px-1 py-0.5 rounded">(empty)</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
