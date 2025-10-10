'use client'

import { ReactNode } from 'react'

interface CollapsibleSidebarProps {
  title: string
  children: ReactNode
  isCollapsed: boolean
  onToggle: () => void
}

export default function CollapsibleSidebar({
  title,
  children,
  isCollapsed,
  onToggle,
}: CollapsibleSidebarProps) {
  if (isCollapsed) {
    return (
      <div className="w-10 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col items-center py-4">
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title={`Show ${title}`}
        >
          <svg
            className="w-4 h-4 text-gray-600 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
          {title}
        </h2>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title={`Hide ${title}`}
        >
          <svg
            className="w-4 h-4 text-gray-600 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </aside>
  )
}
