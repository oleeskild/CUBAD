'use client'

import { useState } from 'react'
import ArtifactManager from './ArtifactManager'
import { ArrowPathIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

/**
 * Demo component showing how to integrate the artifact export/import functionality
 * This can be used as a reference or directly in your application
 */
export default function ArtifactExportImportDemo() {
  const [lastAction, setLastAction] = useState<string>('')
  const [isDemoMode, setIsDemoMode] = useState(true)

  // Mock container information - in real usage, this would come from your app state
  const containerInfo = {
    accountName: isDemoMode ? 'demo-account' : 'your-account',
    resourceGroup: isDemoMode ? 'demo-rg' : undefined,
    databaseName: isDemoMode ? 'demo-database' : 'your-database',
    containerName: isDemoMode ? 'demo-container' : 'your-container'
  }

  const handleRefresh = () => {
    setLastAction(`Refreshed artifacts for ${containerInfo.containerName}`)
    // In real usage, this would trigger a refetch of artifacts
    setTimeout(() => setLastAction(''), 3000)
  }

  const handleEdit = (artifactId: string) => {
    setLastAction(`Edit artifact: ${artifactId}`)
    // In real usage, this would open the artifact editor
  }

  const handleDelete = (artifactIds: string[]) => {
    setLastAction(`Delete ${artifactIds.length} artifact(s): ${artifactIds.join(', ')}`)
    // In real usage, this would show a confirmation dialog and delete the artifacts
  }

  const handleView = (artifactId: string) => {
    setLastAction(`View artifact: ${artifactId}`)
    // In real usage, this would switch to artifact view mode
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Artifact Export/Import Demo</h1>
              <p className="text-sm text-gray-600 mt-1">
                Demonstrating the export and import functionality for artifacts
              </p>
            </div>
            <button
              onClick={() => setIsDemoMode(!isDemoMode)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              {isDemoMode ? 'Use Real Data' : 'Use Demo Data'}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 m-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                This demo shows how to integrate the export/import functionality.
                The toolbar below provides export and import buttons that work with your artifact storage.
              </p>
              <div className="mt-2 text-sm text-blue-700">
                <strong>Current Container:</strong> {containerInfo.accountName}/
                {containerInfo.resourceGroup || 'no-rg'}/
                {containerInfo.databaseName}/
                {containerInfo.containerName}
              </div>
            </div>
          </div>
        </div>

        {/* Artifact Manager */}
        <div className="px-6 pb-6">
          <ArtifactManager
            accountName={containerInfo.accountName}
            resourceGroup={containerInfo.resourceGroup}
            databaseName={containerInfo.databaseName}
            containerName={containerInfo.containerName}
            selectedArtifactIds={[]} // In real usage, this would come from selection state
            onRefresh={handleRefresh}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
          />
        </div>

        {/* Status/Action Feedback */}
        {lastAction && (
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
            <p className="text-sm text-gray-600">
              <strong>Last Action:</strong> {lastAction}
            </p>
          </div>
        )}

        {/* Integration Guide */}
        <div className="border-t border-gray-200 px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Integration Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">1. Basic Integration</h4>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{`import ArtifactManager from './components/ArtifactManager'

<ArtifactManager
  accountName={accountName}
  resourceGroup={resourceGroup}
  databaseName={databaseName}
  containerName={containerName}
  onRefresh={handleRefresh}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onView={handleView}
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">2. Standalone Dialogs</h4>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{`import ArtifactExportDialog from './components/ArtifactExportDialog'
import ArtifactImportDialog from './components/ArtifactImportDialog'

// Export dialog
<ArtifactExportDialog
  isOpen={showExport}
  onClose={() => setShowExport(false)}
  accountName={accountName}
  // ...other props
/>

// Import dialog
<ArtifactImportDialog
  isOpen={showImport}
  onClose={() => setShowImport(false)}
  accountName={accountName}
  // ...other props
/>`}
              </pre>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="font-medium text-yellow-800 mb-2">Key Features</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Export single artifacts, selected batches, or entire containers</li>
              <li>• Include version history for complete artifact evolution</li>
              <li>• Import with flexible options (preserve IDs, versions, overwrite)</li>
              <li>• Cross-environment sharing between different containers/accounts</li>
              <li>• Built-in validation for security and data integrity</li>
              <li>• Automatic JSON file download and upload handling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}