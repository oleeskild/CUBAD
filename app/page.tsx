'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import AccountList from '@/components/AccountList'
import DatabaseList from '@/components/DatabaseList'
import ContainerList from '@/components/ContainerList'
import CommandPalette from '@/components/CommandPalette'
import Breadcrumbs from '@/components/Breadcrumbs'
import QueryEditor from '@/components/QueryEditor'
import ResultsPanel from '@/components/ResultsPanel'
import ResizablePanels from '@/components/ResizablePanels'
import TabBar from '@/components/TabBar'
import CollapsibleSidebar from '@/components/CollapsibleSidebar'
import AIAssistant from '@/components/AIAssistant'
import QueryHistory from '@/components/QueryHistory'
import { useNavigationStore } from '@/store/navigation'
import { useTabStore } from '@/store/tabs'
import { addToQueryHistory } from '@/lib/storage/query-history'
import { usePanelNavigation } from '@/hooks/usePanelNavigation'
import { getSearchIndexMetadata } from '@/lib/db/search-index'

function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { selectedAccount, selectedAccountResourceGroup, selectedDatabase, selectedContainer, initFromUrl } = useNavigationStore()
  const { tabs, getActiveTab, updateTabResults, updateTab, addTab, activeTabId } = useTabStore()
  const [executing, setExecuting] = useState(false)
  const [searchIndexBuilt, setSearchIndexBuilt] = useState(false)
  const [checkingIndex, setCheckingIndex] = useState(true)

  // Sidebar collapse state
  const [accountsCollapsed, setAccountsCollapsed] = useState(false)
  const [databasesCollapsed, setDatabasesCollapsed] = useState(false)
  const [containersCollapsed, setContainersCollapsed] = useState(false)
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false)
  const [queryHistoryOpen, setQueryHistoryOpen] = useState(false)

  // Check if search index is built
  useEffect(() => {
    async function checkSearchIndex() {
      try {
        const metadata = await getSearchIndexMetadata()
        // If there's metadata with counts, the index is built
        if (metadata && metadata.totalAccounts > 0) {
          setSearchIndexBuilt(true)
        }
      } catch (error) {
        console.error('Failed to check search index:', error)
      } finally {
        setCheckingIndex(false)
      }
    }

    checkSearchIndex()
  }, [])

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
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(256, 226)">
                <path d="M 0,-120 L 120,-60 L 0,0 L -120,-60 Z" fill="#93C5FD"/>
                <path d="M 120,-60 L 120,120 L 0,180 L 0,0 Z" fill="#60A5FA"/>
                <path d="M -120,-60 L 0,0 L 0,180 L -120,120 Z" fill="#3B82F6"/>
                <path d="M 0,0 L 120,60 L 0,120 L -120,60 Z" fill="#93C5FD" opacity="0.9"/>
                <path d="M 120,60 L 120,180 L 0,240 L 0,120 Z" fill="#60A5FA" opacity="0.9"/>
                <path d="M -120,60 L 0,120 L 0,240 L -120,180 Z" fill="#3B82F6" opacity="0.9"/>
                <line x1="-120" y1="-60" x2="-120" y2="120" stroke="#2563EB" strokeWidth="3"/>
                <line x1="120" y1="-60" x2="120" y2="180" stroke="#3B82F6" strokeWidth="3"/>
              </g>
            </svg>
            <h1 className="text-2xl font-bold">Cubad</h1>
          </div>
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
            {hasActiveTabs && (
              <>
                <button
                  onClick={() => setQueryHistoryOpen(!queryHistoryOpen)}
                  className={`text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 ${
                    queryHistoryOpen ? 'text-blue-600 dark:text-blue-400' : ''
                  }`}
                  title="Query History"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setAiAssistantOpen(!aiAssistantOpen)}
                  className={`text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 ${
                    aiAssistantOpen ? 'text-blue-600 dark:text-blue-400' : ''
                  }`}
                  title="AI Assistant"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </button>
              </>
            )}
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
                Cosmos UI But Actually Decent
              </p>

              <div className="space-y-4 max-w-2xl">
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4 text-blue-900 dark:text-blue-100">Getting Started</h3>

                  <ol className="space-y-4 text-sm text-blue-800 dark:text-blue-200">
                    <li className="flex gap-3">
                      <span className="font-bold flex-shrink-0">1.</span>
                      <div>
                        <strong>Authenticate with Azure CLI</strong>
                        <p className="text-blue-700 dark:text-blue-300 mt-1">
                          Run <code className="px-1.5 py-0.5 font-mono bg-blue-100 dark:bg-blue-900 rounded">az login</code> and make sure you&apos;re on the correct subscription
                        </p>
                      </div>
                    </li>

                    <li className="flex gap-3">
                      <span className="font-bold flex-shrink-0">2.</span>
                      <div>
                        <strong>Index your databases</strong>
                        <p className="text-blue-700 dark:text-blue-300 mt-1">
                          Build a search index for fast navigation with{' '}
                          <kbd className="px-1.5 py-0.5 font-mono bg-blue-100 dark:bg-blue-900 rounded">⌘K</kbd>
                        </p>
                        {checkingIndex ? (
                          <div className="mt-2 text-blue-600 dark:text-blue-400 text-sm">
                            Checking index status...
                          </div>
                        ) : searchIndexBuilt ? (
                          <div className="mt-2 flex items-center gap-2 text-green-700 dark:text-green-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span className="text-sm font-medium">Search index already built</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => router.push('/settings')}
                            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-medium transition-colors"
                          >
                            Build Search Index
                          </button>
                        )}
                      </div>
                    </li>

                    <li className="flex gap-3">
                      <span className="font-bold flex-shrink-0">3.</span>
                      <div>
                        <strong>Configure AI Assistant (optional)</strong>
                        <p className="text-blue-700 dark:text-blue-300 mt-1">
                          Set up your preferred AI provider in{' '}
                          <a href="/settings" className="underline hover:text-blue-600 dark:hover:text-blue-200">
                            Settings
                          </a>{' '}
                          for natural language query generation
                        </p>
                      </div>
                    </li>

                    <li className="flex gap-3">
                      <span className="font-bold flex-shrink-0">4.</span>
                      <div>
                        <strong>Start querying</strong>
                        <p className="text-blue-700 dark:text-blue-300 mt-1">
                          Select an account from the sidebar or press{' '}
                          <kbd className="px-1.5 py-0.5 font-mono bg-blue-100 dark:bg-blue-900 rounded">⌘K</kbd>{' '}
                          to search for databases and containers
                        </p>
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-sm">Quick Tips</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <li className="flex items-center gap-2">
                      <kbd className="px-1.5 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded text-xs">⌘K</kbd>
                      <span>Open command palette for quick navigation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <kbd className="px-1.5 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded text-xs">⌘↵</kbd>
                      <span>Execute query in the editor</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <kbd className="px-1.5 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded text-xs">h</kbd>
                      <kbd className="px-1.5 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded text-xs">l</kbd>
                      <span>Navigate between panels</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <kbd className="px-1.5 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded text-xs">j</kbd>
                      <kbd className="px-1.5 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded text-xs">k</kbd>
                      <span>Navigate items in lists</span>
                    </li>
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
            <div className="flex-1 min-h-0 flex flex-row">
              <div className="flex-1 min-w-0">
                <ResizablePanels
                  topPanel={<QueryEditor onExecute={executeQuery} executing={executing} />}
                  bottomPanel={
                    activeTab ? (
                      <ResultsPanel
                        tabId={activeTab.id}
                        results={activeTab.results}
                        metadata={activeTab.metadata}
                        error={activeTab.error}
                        context={{
                          accountName: activeTab.accountName || '',
                          resourceGroup: activeTab.accountResourceGroup || undefined,
                          databaseName: activeTab.databaseName || '',
                          containerName: activeTab.containerName || '',
                        }}
                        viewMode={activeTab.viewMode}
                        onRefreshQuery={() => executeQuery(activeTab.query)}
                      />
                    ) : null
                  }
                  defaultTopHeight={50}
                />
              </div>
              {queryHistoryOpen && (
                <div className="w-96 flex-shrink-0">
                  <QueryHistory
                    onSelectQuery={(query) => {
                      if (activeTab) {
                        updateTab(activeTab.id, { query })
                      }
                    }}
                  />
                </div>
              )}
              {aiAssistantOpen && activeTab && (
                <div className="w-96 flex-shrink-0">
                  <AIAssistant
                    context={{
                      containerName: activeTab.containerName || selectedContainer || '',
                      databaseName: activeTab.databaseName || selectedDatabase || '',
                      accountName: activeTab.accountName || selectedAccount || '',
                      resourceGroup: activeTab.accountResourceGroup || selectedAccountResourceGroup || '',
                    }}
                    onInsertQuery={(query) => {
                      if (activeTab) {
                        updateTab(activeTab.id, { query })
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  )
}
