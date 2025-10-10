'use client'

import { useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { useTabStore } from '@/store/tabs'
import type { editor } from 'monaco-editor'

interface QueryEditorProps {
  onExecute: (query: string) => void
  executing: boolean
}

export default function QueryEditor({ onExecute, executing }: QueryEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const { getActiveTab, updateTabQuery, activeTabId } = useTabStore()

  const activeTab = getActiveTab()
  const query = activeTab?.query || ''

  // Auto-focus editor when tab changes
  useEffect(() => {
    if (editorRef.current) {
      // Small delay to ensure editor is mounted
      setTimeout(() => {
        editorRef.current?.focus()
      }, 100)
    }
  }, [activeTabId])

  const handleQueryChange = (value: string | undefined) => {
    if (activeTab) {
      updateTabQuery(activeTab.id, value || '')
    }
  }

  // Handle editor mount
  function handleEditorDidMount(editor: editor.IStandaloneCodeEditor) {
    editorRef.current = editor

    // Add Cmd/Ctrl + Enter command directly to Monaco
    editor.addCommand(
      // KeyMod.CtrlCmd + KeyCode.Enter
      2048 | 3, // Monaco keybinding for Cmd/Ctrl + Enter
      () => {
        if (!executing && query.trim()) {
          const queryHasLimit = /\bLIMIT\s+\d+/i.test(query)
          if (!queryHasLimit) {
            alert('Query must include a LIMIT clause to prevent accidentally fetching all documents. Add "LIMIT 100" to your query.')
            return
          }
          onExecute(query)
        }
      }
    )

    // Focus the editor initially
    editor.focus()
  }

  // Check if query has a LIMIT clause
  const hasLimit = /\bLIMIT\s+\d+/i.test(query)

  return (
    <div className="flex flex-col h-full">
      {/* Warning banner */}
      {!hasLimit && query.trim() && (
        <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-950 border-b border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 text-xs text-yellow-800 dark:text-yellow-200">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              <strong>Warning:</strong> No LIMIT clause detected. This will fetch ALL documents, which may be slow and expensive. Add <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">OFFSET 0 LIMIT 100</code> to your query.
            </span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!hasLimit) {
                alert('Query must include a LIMIT clause to prevent accidentally fetching all documents. Add "LIMIT 100" to your query.')
                return
              }
              onExecute(query)
            }}
            disabled={executing || !query.trim()}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded font-medium transition-colors"
          >
            {executing ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Executing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Execute
              </>
            )}
          </button>

          <div className="text-xs text-gray-500">
            <kbd className="px-1.5 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              ⌘↵
            </kbd>{' '}
            to run
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleQueryChange('SELECT * FROM c OFFSET 0 LIMIT 100')}
            className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="sql"
          value={query}
          onChange={handleQueryChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
          }}
        />
      </div>
    </div>
  )
}
