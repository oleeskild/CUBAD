import { create } from 'zustand'

interface NavigationState {
  // Current selection
  selectedAccount: string | null
  selectedAccountResourceGroup: string | null
  selectedDatabase: string | null
  selectedContainer: string | null

  // Actions
  selectAccount: (accountName: string, resourceGroup: string) => void
  selectDatabase: (databaseId: string) => void
  selectContainer: (containerId: string) => void
  clearSelection: () => void
  clearFromDatabase: () => void
  clearAccount: () => void
  clearDatabase: () => void
  clearContainer: () => void
  // New action to initialize from URL params
  initFromUrl: (params: URLSearchParams) => void
}

// Helper to update URL params
const updateUrlParams = (state: Partial<Pick<NavigationState, 'selectedAccount' | 'selectedAccountResourceGroup' | 'selectedDatabase' | 'selectedContainer'>>) => {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(window.location.search)

  // Update or remove params based on state
  if (state.selectedAccount !== undefined) {
    if (state.selectedAccount) {
      params.set('account', state.selectedAccount)
    } else {
      params.delete('account')
    }
  }

  if (state.selectedAccountResourceGroup !== undefined) {
    if (state.selectedAccountResourceGroup) {
      params.set('resourceGroup', state.selectedAccountResourceGroup)
    } else {
      params.delete('resourceGroup')
    }
  }

  if (state.selectedDatabase !== undefined) {
    if (state.selectedDatabase) {
      params.set('database', state.selectedDatabase)
    } else {
      params.delete('database')
    }
  }

  if (state.selectedContainer !== undefined) {
    if (state.selectedContainer) {
      params.set('container', state.selectedContainer)
    } else {
      params.delete('container')
    }
  }

  // Update URL without reloading
  const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
  window.history.pushState({}, '', newUrl)
}

export const useNavigationStore = create<NavigationState>((set) => ({
  // Initial state
  selectedAccount: null,
  selectedAccountResourceGroup: null,
  selectedDatabase: null,
  selectedContainer: null,

  // Select an account (clears database and container)
  selectAccount: (accountName: string, resourceGroup: string) => {
    const newState = {
      selectedAccount: accountName,
      selectedAccountResourceGroup: resourceGroup,
      selectedDatabase: null,
      selectedContainer: null,
    }
    set(newState)
    updateUrlParams(newState)
  },

  // Select a database (keeps account, clears container)
  selectDatabase: (databaseId: string) => {
    set((state) => {
      const newState = {
        selectedDatabase: databaseId,
        selectedContainer: null,
      }
      updateUrlParams({ ...state, ...newState })
      return newState
    })
  },

  // Select a container (keeps account and database)
  selectContainer: (containerId: string) => {
    set((state) => {
      const newState = {
        selectedContainer: containerId,
      }
      updateUrlParams({ ...state, ...newState })
      return newState
    })
  },

  // Clear all selections
  clearSelection: () => {
    const newState = {
      selectedAccount: null,
      selectedAccountResourceGroup: null,
      selectedDatabase: null,
      selectedContainer: null,
    }
    set(newState)
    updateUrlParams(newState)
  },

  // Clear database and container (keep account selected)
  clearFromDatabase: () => {
    set((state) => {
      const newState = {
        selectedDatabase: null,
        selectedContainer: null,
      }
      updateUrlParams({ ...state, ...newState })
      return newState
    })
  },

  // Clear account (and everything)
  clearAccount: () => {
    const newState = {
      selectedAccount: null,
      selectedAccountResourceGroup: null,
      selectedDatabase: null,
      selectedContainer: null,
    }
    set(newState)
    updateUrlParams(newState)
  },

  // Clear database (and container)
  clearDatabase: () => {
    set((state) => {
      const newState = {
        selectedDatabase: null,
        selectedContainer: null,
      }
      updateUrlParams({ ...state, ...newState })
      return newState
    })
  },

  // Clear only container
  clearContainer: () => {
    set((state) => {
      const newState = {
        selectedContainer: null,
      }
      updateUrlParams({ ...state, ...newState })
      return newState
    })
  },

  // Initialize state from URL params
  initFromUrl: (params: URLSearchParams) => {
    set({
      selectedAccount: params.get('account'),
      selectedAccountResourceGroup: params.get('resourceGroup'),
      selectedDatabase: params.get('database'),
      selectedContainer: params.get('container'),
    })
  },
}))
