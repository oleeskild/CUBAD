import { useEffect } from 'react'
import { useNavigationStore } from '@/store/navigation'

/**
 * Global keyboard navigation between panels using h/l (vim-style)
 * h - go left (clear selection at current level)
 * l - go right (select first item in next panel)
 */
export function usePanelNavigation() {
  const {
    selectedAccount,
    selectedDatabase,
    selectedContainer,
    clearDatabase,
    clearContainer,
    clearAccount,
  } = useNavigationStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return
      }

      // Check if in Monaco editor
      const activeElement = document.activeElement as HTMLElement
      const isInEditor = activeElement?.closest('.monaco-editor')
      if (isInEditor) {
        return
      }

      switch (e.key) {
        case 'h':
          // Go left - clear current selection to go back one level
          e.preventDefault()
          if (selectedContainer) {
            clearContainer()
          } else if (selectedDatabase) {
            clearDatabase()
          } else if (selectedAccount) {
            clearAccount()
          }
          break
        case 'l':
          // Go right - this will be handled by the individual lists
          // when they auto-focus on the rightmost panel
          // We don't need to do anything here as the j/k navigation
          // already only works on the rightmost panel
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAccount, selectedDatabase, selectedContainer, clearAccount, clearDatabase, clearContainer])
}
