'use client'

import { useEffect, useRef, useState } from 'react'
import { ArtifactDefinition } from '@/types/ai'

interface ArtifactViewerProps {
  artifact: ArtifactDefinition
  data?: any[]
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  onEdit?: () => void
}

export default function ArtifactViewer({
  artifact,
  data = [],
  loading = false,
  error = null,
  onRefresh,
  onEdit,
}: ArtifactViewerProps) {
  const [iframeError, setIframeError] = useState<string | null>(null)
  const [srcdocContent, setSrcdocContent] = useState<string>('')

  useEffect(() => {
    const htmlContent = generateIframeContent(artifact.code, data, loading, error)
    setSrcdocContent(htmlContent)
    setIframeError(null)
  }, [artifact.code, data, loading, error])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'artifactError') {
        setIframeError(event.data.error)
      } else if (event.data.type === 'artifactReady') {
        setIframeError(null)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">{artifact.name}</h3>
          <p className="text-xs text-gray-600">{artifact.description}</p>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded hover:bg-blue-100 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Refresh
            </button>
          )}
          <div className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">
            v{artifact.version}
          </div>
        </div>
      </div>

      {iframeError && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200">
          <p className="text-xs text-red-700">
            <strong>Render Error:</strong> {iframeError}
          </p>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <iframe
          srcDoc={srcdocContent}
          className="w-full h-full border-0"
          sandbox="allow-scripts"
          title={artifact.name}
        />
      </div>
    </div>
  )
}

function generateIframeContent(
  componentCode: string,
  data: any[],
  loading: boolean,
  error: string | null
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      overflow: auto;
    }
    #root {
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect, useMemo } = React;

    try {
      ${componentCode}

      const props = {
        data: ${JSON.stringify(data)},
        loading: ${loading},
        error: ${JSON.stringify(error)}
      };

      const container = document.getElementById('root');
      const root = ReactDOM.createRoot(container);

      root.render(React.createElement(ArtifactComponent, props));

      window.parent.postMessage({ type: 'artifactReady' }, '*');

    } catch (error) {
      console.error('Artifact rendering error:', error);
      window.parent.postMessage({
        type: 'artifactError',
        error: error.message || String(error)
      }, '*');

      const container = document.getElementById('root');
      container.innerHTML = \`
        <div style="padding: 20px; background: #fee; border: 1px solid #fcc; border-radius: 4px; margin: 20px;">
          <h3 style="color: #c00; margin: 0 0 10px 0;">Failed to render artifact</h3>
          <p style="margin: 0; color: #600; font-family: monospace; font-size: 12px;">
            \${error.message || String(error)}
          </p>
        </div>
      \`;
    }
  </script>
</body>
</html>
  `.trim()
}
