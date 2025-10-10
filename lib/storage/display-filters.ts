/**
 * Display filter settings for database and container names
 * Uses regex patterns to transform display names
 */

export interface DisplayFilter {
  id: string
  name: string
  pattern: string // regex pattern
  replacement: string // replacement string
  enabled: boolean
  target: 'database' | 'container' | 'both'
}

const STORAGE_KEY = 'cubad-display-filters'

export function getDisplayFilters(): DisplayFilter[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error('Failed to load display filters:', error)
    return []
  }
}

export function saveDisplayFilters(filters: DisplayFilter[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
  } catch (error) {
    console.error('Failed to save display filters:', error)
  }
}

export function addDisplayFilter(filter: Omit<DisplayFilter, 'id'>): DisplayFilter {
  const filters = getDisplayFilters()
  const newFilter: DisplayFilter = {
    ...filter,
    id: `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  }

  filters.push(newFilter)
  saveDisplayFilters(filters)
  return newFilter
}

export function updateDisplayFilter(id: string, updates: Partial<DisplayFilter>): void {
  const filters = getDisplayFilters()
  const index = filters.findIndex((f) => f.id === id)

  if (index !== -1) {
    filters[index] = { ...filters[index], ...updates }
    saveDisplayFilters(filters)
  }
}

export function deleteDisplayFilter(id: string): void {
  const filters = getDisplayFilters().filter((f) => f.id !== id)
  saveDisplayFilters(filters)
}

export function applyDisplayFilters(
  name: string,
  target: 'database' | 'container'
): string {
  const filters = getDisplayFilters()
  let result = name

  for (const filter of filters) {
    if (!filter.enabled) continue
    if (filter.target !== target && filter.target !== 'both') continue

    try {
      const regex = new RegExp(filter.pattern, 'g')
      result = result.replace(regex, filter.replacement)
    } catch (error) {
      // Invalid regex, skip this filter
      console.warn(`Invalid regex pattern in filter "${filter.name}":`, filter.pattern)
    }
  }

  return result
}
