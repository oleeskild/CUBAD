import { create } from 'zustand'

export interface QueryTab {
  id: string
  name: string
  accountName: string | null
  accountResourceGroup: string | null
  databaseName: string | null
  containerName: string | null
  query: string
  results: any[] | null
  metadata: any | null
  error: string | null
}

interface TabStore {
  tabs: QueryTab[]
  activeTabId: string | null

  // Actions
  addTab: (context?: { accountName: string; accountResourceGroup: string; databaseName: string; containerName: string }) => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateTab: (tabId: string, updates: Partial<QueryTab>) => void
  updateTabQuery: (tabId: string, query: string) => void
  updateTabResults: (tabId: string, results: any[] | null, metadata: any | null, error: string | null) => void
  getActiveTab: () => QueryTab | null
}

let tabCounter = 0

function generateTabId(): string {
  return `tab-${Date.now()}-${tabCounter++}`
}

function generateTabName(index: number, containerName?: string | null): string {
  if (containerName) {
    return containerName
  }
  return `Query ${index + 1}`
}

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [],
  activeTabId: null,

  addTab: (context) => {
    const id = generateTabId()
    const tabs = get().tabs
    const name = generateTabName(tabs.length, context?.containerName)

    const newTab: QueryTab = {
      id,
      name,
      accountName: context?.accountName || null,
      accountResourceGroup: context?.accountResourceGroup || null,
      databaseName: context?.databaseName || null,
      containerName: context?.containerName || null,
      query: 'SELECT * FROM c OFFSET 0 LIMIT 100',
      results: null,
      metadata: null,
      error: null,
    }

    set({
      tabs: [...tabs, newTab],
      activeTabId: id,
    })
  },

  closeTab: (tabId) => {
    const { tabs, activeTabId } = get()
    const filteredTabs = tabs.filter((t) => t.id !== tabId)

    let newActiveTabId = activeTabId

    // If closing the active tab, switch to another tab
    if (tabId === activeTabId) {
      if (filteredTabs.length > 0) {
        const closedIndex = tabs.findIndex((t) => t.id === tabId)
        // Try to activate the tab to the right, or the one to the left
        const newIndex = Math.min(closedIndex, filteredTabs.length - 1)
        newActiveTabId = filteredTabs[newIndex]?.id || null
      } else {
        newActiveTabId = null
      }
    }

    set({
      tabs: filteredTabs,
      activeTabId: newActiveTabId,
    })
  },

  setActiveTab: (tabId) => {
    set({ activeTabId: tabId })
  },

  updateTab: (tabId, updates) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, ...updates } : tab
      ),
    }))
  },

  updateTabQuery: (tabId, query) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, query } : tab
      ),
    }))
  },

  updateTabResults: (tabId, results, metadata, error) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, results, metadata, error } : tab
      ),
    }))
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get()
    return tabs.find((t) => t.id === activeTabId) || null
  },
}))
