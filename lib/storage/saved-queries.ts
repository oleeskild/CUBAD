export interface SavedQuery {
  id: string
  name: string
  query: string
  description?: string
  createdAt: number
  updatedAt: number
}

const SAVED_QUERIES_KEY = 'cubad-saved-queries'

export function getSavedQueries(): SavedQuery[] {
  if (typeof window === 'undefined') return []

  try {
    const queries = localStorage.getItem(SAVED_QUERIES_KEY)
    return queries ? JSON.parse(queries) : []
  } catch (error) {
    console.error('Failed to load saved queries:', error)
    return []
  }
}

export function saveQuery(query: Omit<SavedQuery, 'id' | 'createdAt' | 'updatedAt'>): SavedQuery {
  if (typeof window === 'undefined') throw new Error('Cannot save queries on server')

  const queries = getSavedQueries()

  const newQuery: SavedQuery = {
    ...query,
    id: `${Date.now()}-${Math.random()}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  const newQueries = [...queries, newQuery]
  localStorage.setItem(SAVED_QUERIES_KEY, JSON.stringify(newQueries))

  return newQuery
}

export function updateSavedQuery(id: string, updates: Partial<Pick<SavedQuery, 'name' | 'query' | 'description'>>): void {
  if (typeof window === 'undefined') return

  const queries = getSavedQueries()
  const newQueries = queries.map((q) =>
    q.id === id ? { ...q, ...updates, updatedAt: Date.now() } : q
  )

  localStorage.setItem(SAVED_QUERIES_KEY, JSON.stringify(newQueries))
}

export function deleteSavedQuery(id: string): void {
  if (typeof window === 'undefined') return

  const queries = getSavedQueries()
  const newQueries = queries.filter((q) => q.id !== id)
  localStorage.setItem(SAVED_QUERIES_KEY, JSON.stringify(newQueries))
}
