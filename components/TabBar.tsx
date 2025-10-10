'use client'

import { useTabStore, QueryTab } from '@/store/tabs'
import { useNavigationStore } from '@/store/navigation'
import { applyDisplayFilters } from '@/lib/storage/display-filters'

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, addTab } = useTabStore()
  const { selectedAccount, selectedAccountResourceGroup, selectedDatabase, selectedContainer } =
    useNavigationStore()

  const handleAddTab = () => {
    if (selectedAccount && selectedDatabase && selectedContainer && selectedAccountResourceGroup) {
      addTab({
        accountName: selectedAccount,
        accountResourceGroup: selectedAccountResourceGroup,
        databaseName: selectedDatabase,
        containerName: selectedContainer,
      })
    } else {
      addTab()
    }
  }

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    closeTab(tabId)
  }

  const getTabTitle = (tab: QueryTab): string => {
    if (tab.containerName) {
      return applyDisplayFilters(tab.containerName, 'container')
    }
    return tab.name
  }

  const getTabSubtitle = (tab: QueryTab): string | null => {
    if (tab.accountName && tab.databaseName && tab.containerName) {
      const account = applyDisplayFilters(tab.accountName, 'database')
      const database = applyDisplayFilters(tab.databaseName, 'database')
      return `${account} / ${database}`
    }
    return null
  }

  if (tabs.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-2 py-1 overflow-x-auto">
      {tabs.map((tab) => {
        const title = getTabTitle(tab)
        const subtitle = getTabSubtitle(tab)

        return (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              group flex items-center gap-2 px-3 py-2 rounded-t cursor-pointer
              transition-colors min-w-0 max-w-xs
              ${
                tab.id === activeTabId
                  ? 'bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 border-t border-x border-gray-200 dark:border-gray-800'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
          >
            {/* Tab icon */}
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>

            {/* Tab content */}
            <div className="flex flex-col min-w-0 flex-1">
              {/* Tab title (container name) */}
              <span className="truncate text-sm font-medium" title={title}>
                {title}
              </span>

              {/* Tab subtitle (account / database) */}
              {subtitle && (
                <span className="truncate text-xs text-gray-500 dark:text-gray-500" title={subtitle}>
                  {subtitle}
                </span>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={(e) => handleCloseTab(e, tab.id)}
              className="flex-shrink-0 ml-1 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Close tab"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )
      })}

      {/* Add tab button */}
      <button
        onClick={handleAddTab}
        className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors flex-shrink-0"
        title="New tab"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}
