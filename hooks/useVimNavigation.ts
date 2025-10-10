import { useEffect, useState, useCallback } from 'react'

interface UseVimNavigationOptions<T> {
  items: T[]
  onSelect: (item: T) => void
  enabled?: boolean
  getId: (item: T) => string
  priority?: number // Higher priority gets keyboard focus
}

export function useVimNavigation<T>({
  items,
  onSelect,
  enabled = true,
  getId,
  priority = 0,
}: UseVimNavigationOptions<T>) {
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled || items.length === 0) return

      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return
      }

      // Check if this is the highest priority enabled handler
      const activeElement = document.activeElement as HTMLElement
      const isInEditor = activeElement?.closest('.monaco-editor')
      if (isInEditor) {
        return
      }

      switch (e.key) {
        case 'j':
          e.preventDefault()
          setFocusedIndex((prev) => {
            const next = prev + 1
            return next >= items.length ? items.length - 1 : next
          })
          break
        case 'k':
          e.preventDefault()
          setFocusedIndex((prev) => {
            const next = prev - 1
            return next < 0 ? 0 : next
          })
          break
        case 'Enter':
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            e.preventDefault()
            onSelect(items[focusedIndex])
          }
          break
        case 'g':
          // gg to go to top
          if (e.shiftKey === false) {
            e.preventDefault()
            setFocusedIndex(0)
          }
          break
        case 'G':
          // G to go to bottom
          e.preventDefault()
          setFocusedIndex(items.length - 1)
          break
      }
    },
    [enabled, items, focusedIndex, onSelect]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Reset focus when items change
  useEffect(() => {
    setFocusedIndex(-1)
  }, [items.length])

  return {
    focusedIndex,
    setFocusedIndex,
    isFocused: (item: T) => {
      if (focusedIndex < 0 || focusedIndex >= items.length) return false
      return getId(items[focusedIndex]) === getId(item)
    },
  }
}
