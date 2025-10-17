'use client'

import { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { useTabStore } from '@/store/tabs'
import type { editor, languages } from 'monaco-editor'

interface QueryEditorProps {
  onExecute: (query: string) => void
  executing: boolean
}

export default function QueryEditor({ onExecute, executing }: QueryEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<any>(null)
  const completionProviderRef = useRef<any>(null)
  const { getActiveTab, updateTabQuery, activeTabId } = useTabStore()
  const [properties, setProperties] = useState<string[]>([])

  const activeTab = getActiveTab()
  const query = activeTab?.query || ''

  // Fetch sample document properties when tab context changes
  useEffect(() => {
    async function fetchProperties() {
      if (activeTab?.accountName && activeTab?.databaseName && activeTab?.containerName) {
        try {
          console.log('Fetching properties for:', {
            account: activeTab.accountName,
            database: activeTab.databaseName,
            container: activeTab.containerName
          })
          const response = await fetch(
            `/api/sample-document?accountName=${activeTab.accountName}&resourceGroup=${activeTab.accountResourceGroup}&databaseId=${activeTab.databaseName}&containerId=${activeTab.containerName}`
          )
          const data = await response.json()
          console.log('Received properties:', data)
          if (data.success && data.properties) {
            setProperties(data.properties)
          }
        } catch (error) {
          console.error('Failed to fetch sample document properties:', error)
        }
      }
    }

    fetchProperties()
  }, [activeTab?.accountName, activeTab?.databaseName, activeTab?.containerName])

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

  // Register/update completion provider when properties change
  useEffect(() => {
    if (!monacoRef.current) return

    // Dispose previous provider if exists
    if (completionProviderRef.current) {
      completionProviderRef.current.dispose()
    }

    console.log('Registering completion provider with properties:', properties)

    // Register new completion provider
    completionProviderRef.current = monacoRef.current.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        }

        // SQL keywords
        const sqlKeywords = [
          'SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING',
          'LIMIT', 'OFFSET', 'AS', 'JOIN', 'INNER', 'LEFT', 'RIGHT',
          'ON', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE', 'IS',
          'NULL', 'DESC', 'ASC', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
          'DISTINCT', 'TOP', 'VALUE'
        ]

        // Cosmos DB system properties
        const systemProperties = ['_rid', '_self', '_etag', '_attachments', '_ts', 'id']

        // Sort properties alphabetically
        const sortedProperties = [...properties].sort((a, b) => a.localeCompare(b))

        const suggestions = [
          // Document properties from sample (alphabetically sorted, at the top)
          ...sortedProperties.map((prop, index) => ({
            label: prop,
            kind: monacoRef.current.languages.CompletionItemKind.Field,
            insertText: prop,
            detail: 'Document property',
            sortText: `0${index.toString().padStart(4, '0')}`, // Sort to top
            range,
          })),
          // System properties
          ...systemProperties.map((prop, index) => ({
            label: prop,
            kind: monacoRef.current.languages.CompletionItemKind.Property,
            insertText: prop,
            detail: 'System property',
            sortText: `1${index.toString().padStart(4, '0')}`, // After document properties
            range,
          })),
          // Add 'c.' prefix suggestions
          {
            label: 'c',
            kind: monacoRef.current.languages.CompletionItemKind.Variable,
            insertText: 'c.',
            detail: 'Container alias',
            sortText: '20000',
            range,
          },
          // SQL Keywords
          ...sqlKeywords.map((keyword, index) => ({
            label: keyword,
            kind: monacoRef.current.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            sortText: `3${index.toString().padStart(4, '0')}`, // At the bottom
            range,
          })),
        ]

        console.log('Providing suggestions:', suggestions.length)
        return { suggestions }
      },
    })

    // Cleanup on unmount
    return () => {
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose()
      }
    }
  }, [properties])

  // Handle editor mount
  function handleEditorDidMount(editor: editor.IStandaloneCodeEditor, monaco: any) {
    editorRef.current = editor
    monacoRef.current = monaco

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

    // Set cursor position to line 2 (the blank line) if this is the default query
    const defaultQuery = 'SELECT * FROM c\n\nOFFSET 0 LIMIT 100'
    if (query === defaultQuery) {
      editor.setPosition({ lineNumber: 2, column: 1 })
    }

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
            onClick={() => {
              handleQueryChange('SELECT * FROM c\n\nOFFSET 0 LIMIT 100')
              // Set cursor position after clearing
              setTimeout(() => {
                if (editorRef.current) {
                  editorRef.current.setPosition({ lineNumber: 2, column: 1 })
                  editorRef.current.focus()
                }
              }, 50)
            }}
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
