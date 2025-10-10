export interface QueryHistoryItem {
  id: string
  query: string
  accountName: string
  databaseName: string
  containerName: string
  timestamp: number
  executionTime?: number
  requestCharge?: number
  resultCount?: number
}

const HISTORY_KEY = 'cubad-query-history'
const MAX_HISTORY_ITEMS = 50

export function getQueryHistory(): QueryHistoryItem[] {
  if (typeof window === 'undefined') return []

  try {
    const history = localStorage.getItem(HISTORY_KEY)
    return history ? JSON.parse(history) : []
  } catch (error) {
    console.error('Failed to load query history:', error)
    return []
  }
}

export function addToQueryHistory(item: Omit<QueryHistoryItem, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return

  try {
    const history = getQueryHistory()

    const newItem: QueryHistoryItem = {
      ...item,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    }

    // Add to beginning, limit to MAX_HISTORY_ITEMS
    const newHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS)

    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
  } catch (error) {
    console.error('Failed to save query history:', error)
  }
}

export function clearQueryHistory(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(HISTORY_KEY)
}

export function deleteQueryHistoryItem(id: string): void {
  if (typeof window === 'undefined') return

  try {
    const history = getQueryHistory()
    const newHistory = history.filter((item) => item.id !== id)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
  } catch (error) {
    console.error('Failed to delete query history item:', error)
  }
}
