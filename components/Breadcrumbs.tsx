'use client'

import { useNavigationStore } from '@/store/navigation'

export default function Breadcrumbs() {
  const {
    selectedAccount,
    selectedDatabase,
    selectedContainer,
    clearSelection,
    clearFromDatabase,
    selectAccount,
    selectedAccountResourceGroup,
  } = useNavigationStore()

  if (!selectedAccount) {
    return (
      <div className="text-sm text-gray-500">
        No selection • Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">⌘K</kbd> to search
      </div>
    )
  }

  return (
    <nav className="flex items-center space-x-2 text-sm">
      <button
        onClick={clearSelection}
        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        title="Clear selection"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      </button>

      <span className="text-gray-400">/</span>

      <button
        onClick={() => {
          if (selectedAccountResourceGroup) {
            selectAccount(selectedAccount, selectedAccountResourceGroup)
          }
        }}
        className={`font-medium ${
          selectedDatabase || selectedContainer
            ? 'text-blue-600 dark:text-blue-400 hover:underline'
            : 'text-gray-900 dark:text-gray-100'
        }`}
      >
        {selectedAccount}
      </button>

      {selectedDatabase && (
        <>
          <span className="text-gray-400">/</span>
          <button
            onClick={() => {
              if (!selectedContainer) return
              clearFromDatabase()
            }}
            className={`font-medium ${
              selectedContainer
                ? 'text-blue-600 dark:text-blue-400 hover:underline'
                : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            {selectedDatabase}
          </button>
        </>
      )}

      {selectedContainer && (
        <>
          <span className="text-gray-400">/</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {selectedContainer}
          </span>
        </>
      )}
    </nav>
  )
}
