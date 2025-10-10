'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import AccountList from '@/components/AccountList'
import DatabaseList from '@/components/DatabaseList'
import ContainerList from '@/components/ContainerList'
import CommandPalette from '@/components/CommandPalette'
import Breadcrumbs from '@/components/Breadcrumbs'
import QueryEditor from '@/components/QueryEditor'
import ResultsView from '@/components/ResultsView'
import ResizablePanels from '@/components/ResizablePanels'
import TabBar from '@/components/TabBar'
import CollapsibleSidebar from '@/components/CollapsibleSidebar'
import { useNavigationStore } from '@/store/navigation'
import { useTabStore } from '@/store/tabs'
import { addToQueryHistory } from '@/lib/storage/query-history'
import { usePanelNavigation } from '@/hooks/usePanelNavigation'

export default function Home() {
  const searchParams = useSearchParams()
  const { selectedAccount, selectedAccountResourceGroup, selectedDatabase, selectedContainer, initFromUrl } = useNavigationStore()
  const { tabs, getActiveTab, updateTabResults, updateTab, addTab, activeTabId } = useTabStore()
  const [executing, setExecuting] = useState(false)

  // Sidebar collapse state
  const [accountsCollapsed, setAccountsCollapsed] = useState(false)
  const [databasesCollapsed, setDatabasesCollapsed] = useState(false)
  const [containersCollapsed, setContainersCollapsed] = useState(false)

  // Initialize navigation state from URL params on mount
  useEffect(() => {
    if (searchParams) {
      initFromUrl(searchParams)
    }
  }, []) // Only run on mount

  // Enable h/l panel navigation
  usePanelNavigation()

  // Create initial tab when container is selected for first time
  useEffect(() => {
    if (selectedContainer && tabs.length === 0) {
      addTab({
        accountName: selectedAccount!,
        accountResourceGroup: selectedAccountResourceGroup!,
        databaseName: selectedDatabase!,
        containerName: selectedContainer,
      })
    }
  }, [selectedContainer, tabs.length, selectedAccount, selectedAccountResourceGroup, selectedDatabase, addTab])

  // Update active tab's context when navigation changes
  useEffect(() => {
    const activeTab = getActiveTab()
    if (activeTab && selectedContainer) {
      // Update the active tab's context to match current navigation
      updateTab(activeTab.id, {
        accountName: selectedAccount,
        accountResourceGroup: selectedAccountResourceGroup,
        databaseName: selectedDatabase,
        containerName: selectedContainer,
        name: selectedContainer, // Update tab name too
      })
    }
  }, [selectedAccount, selectedAccountResourceGroup, selectedDatabase, selectedContainer, getActiveTab, updateTab])

  async function executeQuery(query: string) {
    const activeTab = getActiveTab()
    if (!activeTab) return

    // Use tab's context if available, otherwise use navigation context
    const accountName = activeTab.accountName || selectedAccount
    const accountResourceGroup = activeTab.accountResourceGroup || selectedAccountResourceGroup
    const databaseName = activeTab.databaseName || selectedDatabase
    const containerName = activeTab.containerName || selectedContainer

    if (!accountName || !accountResourceGroup || !databaseName || !containerName) {
      return
    }

    setExecuting(true)
    updateTabResults(activeTab.id, null, null, null)

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName,
          resourceGroup: accountResourceGroup,
          databaseId: databaseName,
          containerId: containerName,
          query,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Query failed')
      }

      updateTabResults(activeTab.id, data.results, data.metadata, null)

      // Add to history
      addToQueryHistory({
        query,
        accountName,
        databaseName,
        containerName,
        executionTime: data.metadata.executionTime,
        requestCharge: data.metadata.requestCharge,
        resultCount: data.metadata.count,
      })
    } catch (err: any) {
      console.error('Query execution error:', err)
      updateTabResults(activeTab.id, null, null, err.message || 'An unknown error occurred')
    } finally {
      setExecuting(false)
    }
  }

  const activeTab = getActiveTab()
  const hasActiveTabs = tabs.length > 0

  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <CommandPalette />

      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold">Cubad</h1>
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-500">
              <kbd className="px-1.5 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">⌘K</kbd> search
              {' · '}
              <kbd className="px-1.5 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">h</kbd>
              <kbd className="px-1.5 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">l</kbd> panels
              {' · '}
              <kbd className="px-1.5 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">j</kbd>
              <kbd className="px-1.5 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">k</kbd> items
              {' · '}
              <kbd className="px-1.5 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">↵</kbd> select
            </div>
            <a
              href="/settings"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </a>
          </div>
        </div>
        <Breadcrumbs />
      </header>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Accounts Sidebar */}
        <CollapsibleSidebar
          title="Accounts"
          isCollapsed={accountsCollapsed}
          onToggle={() => setAccountsCollapsed(!accountsCollapsed)}
        >
          <AccountList />
        </CollapsibleSidebar>

        {/* Databases Sidebar */}
        {selectedAccount && (
          <CollapsibleSidebar
            title="Databases"
            isCollapsed={databasesCollapsed}
            onToggle={() => setDatabasesCollapsed(!databasesCollapsed)}
          >
            <DatabaseList />
          </CollapsibleSidebar>
        )}

        {/* Containers Sidebar */}
        {selectedDatabase && (
          <CollapsibleSidebar
            title="Containers"
            isCollapsed={containersCollapsed}
            onToggle={() => setContainersCollapsed(!containersCollapsed)}
          >
            <ContainerList />
          </CollapsibleSidebar>
        )}

        {/* Main content */}
        <div className={`flex-1 min-w-0 ${hasActiveTabs ? 'flex flex-col overflow-hidden' : 'p-8 overflow-y-auto'}`}>
          {/* Tab Bar */}
          {hasActiveTabs && <TabBar />}

          {!selectedAccount && !hasActiveTabs && (
            <>
              <h2 className="text-3xl font-bold mb-2">Welcome to Cubad</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                A better UI for Azure Cosmos DB
              </p>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Get started by selecting an account from the sidebar or press{' '}
                  <kbd className="px-1.5 py-0.5 font-mono bg-blue-100 dark:bg-blue-900 rounded">⌘K</kbd>{' '}
                  to search
                </p>
              </div>

              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Phase 2 Complete ✓</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>✓ Database and container navigation</li>
                    <li>✓ Command palette (⌘K)</li>
                    <li>✓ Hierarchical sidebar navigation</li>
                    <li>✓ Breadcrumb navigation</li>
                    <li>✓ State management with Zustand</li>
                  </ul>
                </div>

                <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Next: Phase 3</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>→ Query editor with Monaco</li>
                    <li>→ Execute queries with read-only keys</li>
                    <li>→ Results viewer with JSON formatting</li>
                    <li>→ Query history and saved queries</li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {selectedAccount && !selectedDatabase && !hasActiveTabs && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📁</div>
              <h2 className="text-2xl font-semibold mb-2">Select a Database</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a database from the sidebar to view its containers
              </p>
            </div>
          )}

          {selectedDatabase && !selectedContainer && !hasActiveTabs && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📦</div>
              <h2 className="text-2xl font-semibold mb-2">Select a Container</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a container from the sidebar to start querying
              </p>
            </div>
          )}

          {hasActiveTabs && (
            <div className="flex-1 min-h-0">
              <ResizablePanels
                topPanel={<QueryEditor onExecute={executeQuery} executing={executing} />}
                bottomPanel={
                  <ResultsView
                    results={activeTab?.results || null}
                    metadata={activeTab?.metadata || null}
                    error={activeTab?.error || null}
                  />
                }
                defaultTopHeight={50}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
