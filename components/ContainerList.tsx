'use client'

import { useEffect, useState } from 'react'
import { useNavigationStore } from '@/store/navigation'
import { applyDisplayFilters } from '@/lib/storage/display-filters'
import { useVimNavigation } from '@/hooks/useVimNavigation'
import { getSearchIndex } from '@/lib/db/search-index'

export default function ContainerList() {
  const {
    selectedAccount,
    selectedAccountResourceGroup,
    selectedDatabase,
    selectedContainer,
    selectContainer,
  } = useNavigationStore()
  const [containers, setContainers] = useState<
    Array<{ id: string; partitionKey?: string }>
  >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter containers based on search query
  const filteredContainers = containers.filter((container) => {
    const query = searchQuery.toLowerCase()
    return (
      container.id.toLowerCase().includes(query) ||
      (container.partitionKey && container.partitionKey.toLowerCase().includes(query))
    )
  })

  const { isFocused } = useVimNavigation({
    items: filteredContainers,
    onSelect: (container) => selectContainer(container.id),
    getId: (container) => container.id,
    enabled: !loading && !error && filteredContainers.length > 0 && !!selectedDatabase,
  })

  useEffect(() => {
    if (!selectedAccount || !selectedAccountResourceGroup || !selectedDatabase) {
      setContainers([])
      return
    }

    async function fetchContainers() {
      setLoading(true)
      setError(null)

      try {
        // First, try to load from IndexedDB
        const cachedData = await getSearchIndex()
        if (cachedData.containers && cachedData.containers.length > 0) {
          // Filter containers for the selected account and database
          const databaseContainers = cachedData.containers.filter(
            (cont) => cont.accountName === selectedAccount && cont.databaseName === selectedDatabase
          )

          if (databaseContainers.length > 0) {
            setContainers(databaseContainers)
            setLoading(false)
            return
          }
        }

        // If no cached data, fetch from API
        const response = await fetch(
          `/api/containers?accountName=${selectedAccount}&resourceGroup=${selectedAccountResourceGroup}&databaseId=${selectedDatabase}`
        )
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch containers')
        }

        setContainers(data.containers)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchContainers()
  }, [selectedAccount, selectedAccountResourceGroup, selectedDatabase])

  if (!selectedDatabase) {
    return (
      <div className="text-sm text-gray-500 text-center py-8">
        Select a database to view containers
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

  if (containers.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-8">
        No containers found in this database
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <div className="sticky top-0 bg-white dark:bg-gray-950 pb-2 z-10">
        <input
          type="text"
          placeholder="Search containers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
      </div>

      {filteredContainers.length === 0 && searchQuery && (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No containers match &quot;{searchQuery}&quot;
        </div>
      )}

      {filteredContainers.map((container) => {
        const isSelected = selectedContainer === container.id
        const focused = isFocused(container)
        return (
          <button
            key={container.id}
            onClick={() => selectContainer(container.id)}
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
                  : 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300'
              }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm break-words ${
                  isSelected ? 'text-blue-700 dark:text-blue-300' : ''
                }`}>
                  {applyDisplayFilters(container.id, 'container')}
                </div>
                {container.partitionKey && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 break-words">
                    Partition: {container.partitionKey}
                  </div>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
