'use client'

import { useEffect, useState } from 'react'
import { CosmosAccount } from '@/types/cosmos'
import { useNavigationStore } from '@/store/navigation'
import { useVimNavigation } from '@/hooks/useVimNavigation'
import { getSearchIndex } from '@/lib/db/search-index'

export default function AccountList() {
  const { selectedAccount, selectAccount } = useNavigationStore()
  const [accounts, setAccounts] = useState<CosmosAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter accounts based on search query
  const filteredAccounts = accounts.filter((account) => {
    const query = searchQuery.toLowerCase()
    return (
      account.name.toLowerCase().includes(query) ||
      account.location.toLowerCase().includes(query) ||
      account.resourceGroup.toLowerCase().includes(query)
    )
  })

  const { isFocused } = useVimNavigation({
    items: filteredAccounts,
    onSelect: (account) => selectAccount(account.name, account.resourceGroup),
    getId: (account) => account.id,
    enabled: !loading && !error && filteredAccounts.length > 0 && !selectedAccount, // Only when no account selected
  })

  useEffect(() => {
    async function fetchAccounts() {
      try {
        // First, try to load from IndexedDB
        const cachedData = await getSearchIndex()
        if (cachedData.accounts && cachedData.accounts.length > 0) {
          setAccounts(cachedData.accounts as CosmosAccount[])
          setLoading(false)
          return
        }

        // If no cached data, fetch from API
        const response = await fetch('/api/accounts')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch accounts')
        }

        setAccounts(data.accounts)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAccounts()
  }, [])

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
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

  if (accounts.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
        No Cosmos DB accounts found in this subscription
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <div className="sticky top-0 bg-white dark:bg-gray-950 pb-2 z-10">
        <input
          type="text"
          placeholder="Search accounts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
      </div>

      {filteredAccounts.length === 0 && searchQuery && (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No accounts match &quot;{searchQuery}&quot;
        </div>
      )}

      {filteredAccounts.map((account) => {
        const isSelected = selectedAccount === account.name
        const focused = isFocused(account)
        return (
          <button
            key={account.id}
            onClick={() => selectAccount(account.name, account.resourceGroup)}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${
              isSelected
                ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950'
                : focused
                ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950 ring-2 ring-purple-300 dark:ring-purple-700'
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <div className={`font-semibold text-sm mb-1 break-words ${
              isSelected ? 'text-blue-700 dark:text-blue-300' : ''
            }`}>
              {account.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 break-words">
              {account.location}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 break-words">
              {account.resourceGroup}
            </div>
          </button>
        )
      })}
    </div>
  )
}
