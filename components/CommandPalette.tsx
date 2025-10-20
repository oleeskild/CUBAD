'use client'

import { useEffect, useState, useRef } from 'react'
import { Command } from 'cmdk'
import { CosmosAccount } from '@/types/cosmos'
import { useNavigationStore } from '@/store/navigation'
import { getSearchIndex } from '@/lib/db/search-index'
import { applyDisplayFilters } from '@/lib/storage/display-filters'
import { fuzzyFilter } from '@/lib/fuzzy-search'

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [accounts, setAccounts] = useState<CosmosAccount[]>([])
  const [databases, setDatabases] = useState<Array<{ id: string; accountName: string; accountResourceGroup: string }>>([])
  const [containers, setContainers] = useState<Array<{ id: string; accountName: string; accountResourceGroup: string; databaseName: string }>>([])
  const [contextContainers, setContextContainers] = useState<Array<{ id: string; accountName: string; accountResourceGroup: string; databaseName: string }>>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const { selectAccount, selectDatabase, selectContainer, selectedDatabase, selectedAccount } = useNavigationStore()

  // Listen for cmd+k / ctrl+k
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Focus input when palette opens
  useEffect(() => {
    if (open && inputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }, [open])

  // Search index when query changes
  useEffect(() => {
    if (!open) return

    async function searchIndex() {
      try {
        const index = await getSearchIndex()

        // Use fuzzy search to filter and sort results
        const filteredAccounts = fuzzyFilter(
          index.accounts as CosmosAccount[],
          search,
          (acc) => [acc.name, acc.location, acc.resourceGroup],
          10
        )

        const filteredDatabases = fuzzyFilter(
          index.databases,
          search,
          (db) => [
            db.id,
            db.accountName,
            applyDisplayFilters(db.id, 'database'),
            applyDisplayFilters(db.accountName, 'database'),
          ],
          15
        )

        const filteredContainers = fuzzyFilter(
          index.containers,
          search,
          (cont) => [
            cont.id,
            cont.databaseName,
            cont.accountName,
            applyDisplayFilters(cont.id, 'container'),
            applyDisplayFilters(cont.databaseName, 'database'),
            applyDisplayFilters(cont.accountName, 'database'),
          ],
          15
        )

        // Filter containers for the selected account and database if both are selected
        let contextFilteredContainers: Array<{ id: string; accountName: string; accountResourceGroup: string; databaseName: string }> = []
        if (selectedDatabase && selectedAccount) {
          const containersInSelectedContext = index.containers.filter(
            cont => cont.databaseName === selectedDatabase && cont.accountName === selectedAccount
          )
          contextFilteredContainers = fuzzyFilter(
            containersInSelectedContext,
            search,
            (cont) => [
              cont.id,
              applyDisplayFilters(cont.id, 'container'),
            ],
            15
          )
        }

        setAccounts(filteredAccounts)
        setDatabases(filteredDatabases)
        setContainers(filteredContainers)
        setContextContainers(contextFilteredContainers)
      } catch (error) {
        console.error('Failed to search index:', error)
        // Fallback: try to fetch accounts from API
        if (!search) {
          try {
            const response = await fetch('/api/accounts')
            const data = await response.json()
            if (response.ok) {
              setAccounts(data.accounts.slice(0, 10))
            }
          } catch (apiError) {
            console.error('Failed to fetch accounts from API:', apiError)
          }
        }
      }
    }

    // Debounce search
    const timeoutId = setTimeout(() => {
      searchIndex()
    }, 150)

    return () => clearTimeout(timeoutId)
  }, [open, search, selectedDatabase, selectedAccount])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)}>
      <div className="fixed left-1/2 top-1/4 -translate-x-1/2 w-full max-w-2xl">
        <Command
          className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center border-b border-gray-200 dark:border-gray-800 px-3">
            <svg
              className="w-5 h-5 text-gray-400 mr-2"
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
            <Command.Input
              ref={inputRef}
              value={search}
              onValueChange={setSearch}
              placeholder={databases.length > 0 ? "Search accounts, databases, containers..." : "Search accounts..."}
              className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-gray-400"
            />
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-1.5 font-mono text-xs text-gray-600 dark:text-gray-400">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-96 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-gray-500">
              No results found.
            </Command.Empty>

            {selectedDatabase && contextContainers.length > 0 && (
              <Command.Group heading={`Containers in ${applyDisplayFilters(selectedDatabase, 'database')}`} className="text-xs font-semibold text-gray-500 px-2 py-1.5">
                {contextContainers.map((container) => (
                  <Command.Item
                    key={`${container.accountName}-${container.databaseName}-${container.id}`}
                    value={`${container.id} ${container.databaseName} ${container.accountName}`}
                    onSelect={() => {
                      selectAccount(container.accountName, container.accountResourceGroup)
                      selectDatabase(container.databaseName)
                      selectContainer(container.id)
                      setOpen(false)
                    }}
                    className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{applyDisplayFilters(container.id, 'container')}</div>
                      <div className="text-xs text-gray-500">
                        {applyDisplayFilters(container.accountName, 'database')}
                      </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {accounts.length > 0 && (
              <Command.Group heading="Accounts" className="text-xs font-semibold text-gray-500 px-2 py-1.5">
                {accounts.map((account) => (
                  <Command.Item
                    key={account.id}
                    value={`${account.name} ${account.location} ${account.resourceGroup}`}
                    onSelect={() => {
                      selectAccount(account.name, account.resourceGroup)
                      setOpen(false)
                    }}
                    className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{account.name}</div>
                      <div className="text-xs text-gray-500">
                        {account.location} • {account.resourceGroup}
                      </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {databases.length > 0 && (
              <Command.Group heading="Databases" className="text-xs font-semibold text-gray-500 px-2 py-1.5">
                {databases.map((db) => (
                  <Command.Item
                    key={`${db.accountName}-${db.id}`}
                    value={`${db.id} ${db.accountName}`}
                    onSelect={() => {
                      selectAccount(db.accountName, db.accountResourceGroup)
                      selectDatabase(db.id)
                      setOpen(false)
                    }}
                    className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{applyDisplayFilters(db.id, 'database')}</div>
                      <div className="text-xs text-gray-500">{applyDisplayFilters(db.accountName, 'database')}</div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {containers.length > 0 && (
              <Command.Group heading="Containers" className="text-xs font-semibold text-gray-500 px-2 py-1.5">
                {containers.map((container) => (
                  <Command.Item
                    key={`${container.accountName}-${container.databaseName}-${container.id}`}
                    value={`${container.id} ${container.databaseName} ${container.accountName}`}
                    onSelect={() => {
                      selectAccount(container.accountName, container.accountResourceGroup)
                      selectDatabase(container.databaseName)
                      selectContainer(container.id)
                      setOpen(false)
                    }}
                    className="flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{applyDisplayFilters(container.id, 'container')}</div>
                      <div className="text-xs text-gray-500">
                        {applyDisplayFilters(container.accountName, 'database')} / {applyDisplayFilters(container.databaseName, 'database')}
                      </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
