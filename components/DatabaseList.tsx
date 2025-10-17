'use client'

import { useEffect, useState } from 'react'
import { useNavigationStore } from '@/store/navigation'
import { applyDisplayFilters } from '@/lib/storage/display-filters'
import { useVimNavigation } from '@/hooks/useVimNavigation'
import { getSearchIndex } from '@/lib/db/search-index'

export default function DatabaseList() {
  const { selectedAccount, selectedAccountResourceGroup, selectedDatabase, selectDatabase } = useNavigationStore()
  const [databases, setDatabases] = useState<Array<{ id: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter databases based on search query
  const filteredDatabases = databases.filter((db) => {
    const query = searchQuery.toLowerCase()
    return db.id.toLowerCase().includes(query)
  })

  const { isFocused } = useVimNavigation({
    items: filteredDatabases,
    onSelect: (db) => selectDatabase(db.id),
    getId: (db) => db.id,
    enabled: !loading && !error && filteredDatabases.length > 0 && !!selectedAccount && !selectedDatabase, // Only when no database selected
  })

  useEffect(() => {
    if (!selectedAccount || !selectedAccountResourceGroup) {
      setDatabases([])
      return
    }

    async function fetchDatabases() {
      setLoading(true)
      setError(null)

      try {
        // First, try to load from IndexedDB
        const cachedData = await getSearchIndex()
        if (cachedData.databases && cachedData.databases.length > 0) {
          // Filter databases for the selected account
          const accountDatabases = cachedData.databases.filter(
            (db) => db.accountName === selectedAccount
          )

          if (accountDatabases.length > 0) {
            setDatabases(accountDatabases)
            setLoading(false)

            // Auto-select if there's only one database and no database is currently selected
            if (accountDatabases.length === 1 && !selectedDatabase) {
              selectDatabase(accountDatabases[0].id)
            }
            return
          }
        }

        // If no cached data, fetch from API
        const response = await fetch(
          `/api/databases?accountName=${selectedAccount}&resourceGroup=${selectedAccountResourceGroup}`
        )
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch databases')
        }

        setDatabases(data.databases)

        // Auto-select if there's only one database and no database is currently selected
        if (data.databases.length === 1 && !selectedDatabase) {
          selectDatabase(data.databases[0].id)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDatabases()
  }, [selectedAccount, selectedAccountResourceGroup])

  if (!selectedAccount) {
    return (
      <div className="text-sm text-gray-500 text-center py-8">
        Select an account to view databases
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm">
        <p className="text-red-800 dark:text-red-200 font-semibold mb-1">Error</p>
        <p className="text-red-700 dark:text-red-300">{error}</p>
      </div>
    )
  }

  if (databases.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-8">
        No databases found in this account
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <div className="sticky top-0 bg-white dark:bg-gray-950 pb-2 z-10">
        <input
          type="text"
          placeholder="Search databases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
      </div>

      {filteredDatabases.length === 0 && searchQuery && (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No databases match &quot;{searchQuery}&quot;
        </div>
      )}

      {filteredDatabases.map((db) => {
        const isSelected = selectedDatabase === db.id
        const focused = isFocused(db)
        return (
          <button
            key={db.id}
            onClick={() => selectDatabase(db.id)}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${
              isSelected
                ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950'
                : focused
                ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950 ring-2 ring-purple-300 dark:ring-purple-700'
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-md flex-shrink-0 ${
                isSelected
                  ? 'bg-blue-600 dark:bg-blue-500 text-white'
                  : 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300'
              }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
              <div className={`font-medium text-sm flex-1 min-w-0 break-words ${
                isSelected ? 'text-blue-700 dark:text-blue-300' : ''
              }`}>
                {applyDisplayFilters(db.id, 'database')}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
