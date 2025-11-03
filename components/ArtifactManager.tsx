'use client'

import { useState } from 'react'
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CogIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import ArtifactExportDialog from './ArtifactExportDialog'
import ArtifactImportDialog from './ArtifactImportDialog'

interface ArtifactManagerProps {
  accountName: string
  resourceGroup?: string
  databaseName: string
  containerName: string
  selectedArtifactIds?: string[]
  onRefresh?: () => void
  onEdit?: (artifactId: string) => void
  onDelete?: (artifactIds: string[]) => void
  onView?: (artifactId: string) => void
}

export default function ArtifactManager({
  accountName,
  resourceGroup,
  databaseName,
  containerName,
  selectedArtifactIds = [],
  onRefresh,
  onEdit,
  onDelete,
  onView
}: ArtifactManagerProps) {
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)

  const handleExportSuccess = () => {
    onRefresh?.()
  }

  const handleImportSuccess = () => {
    onRefresh?.()
  }

  return (
    <>
      <div className="flex items-center space-x-2 p-2 bg-gray-50 border-b border-gray-200">
        {/* Export Button */}
        <button
          onClick={() => setShowExportDialog(true)}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          title="Export artifacts"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
          Export
        </button>

        {/* Import Button */}
        <button
          onClick={() => setShowImportDialog(true)}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          title="Import artifacts"
        >
          <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
          Import
        </button>

        {/* Action buttons for selected artifacts */}
        {selectedArtifactIds.length > 0 && (
          <>
            <div className="h-4 w-px bg-gray-300" />

            <span className="text-xs text-gray-500">
              {selectedArtifactIds.length} selected
            </span>

            {selectedArtifactIds.length === 1 && (
              <>
                <button
                  onClick={() => onView?.(selectedArtifactIds[0])}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  title="View artifact"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>

                <button
                  onClick={() => onEdit?.(selectedArtifactIds[0])}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  title="Edit artifact"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              </>
            )}

            <button
              onClick={() => onDelete?.(selectedArtifactIds)}
              className="inline-flex items-center px-2 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              title="Delete selected artifacts"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </>
        )}

        <div className="flex-1" />

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          title="Refresh artifacts"
        >
          <CogIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Export Dialog */}
      <ArtifactExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        accountName={accountName}
        resourceGroup={resourceGroup}
        databaseName={databaseName}
        containerName={containerName}
        selectedArtifactIds={selectedArtifactIds}
      />

      {/* Import Dialog */}
      <ArtifactImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onSuccess={handleImportSuccess}
        accountName={accountName}
        resourceGroup={resourceGroup}
        databaseName={databaseName}
        containerName={containerName}
      />
    </>
  )
}