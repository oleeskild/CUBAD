'use client'

import { useState, useEffect } from 'react'
import ResultsView from './ResultsView'
import ArtifactViewer from './ArtifactViewer'
import ArtifactGenerator from './ArtifactGenerator'
import ArtifactEditor from './ArtifactEditor'
import ArtifactExportDialog from './ArtifactExportDialog'
import ArtifactImportDialog from './ArtifactImportDialog'
import { ArtifactDefinition, AIQueryContext } from '@/types/ai'
import { useContainerArtifactStore } from '@/store/container-artifacts'
import { useTabStore } from '@/store/tabs'

interface ResultsPanelProps {
  tabId: string
  results: any[] | null
  metadata: {
    count: number
    requestCharge: number
    executionTime: number
  } | null
  error: string | null
  context: AIQueryContext
  viewMode: 'query' | 'artifact'
  onRefreshQuery?: () => void
}

export default function ResultsPanel({
  tabId,
  results,
  metadata,
  error,
  context,
  viewMode,
  onRefreshQuery,
}: ResultsPanelProps) {
  const [showGenerator, setShowGenerator] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [expandedArtifactNames, setExpandedArtifactNames] = useState<Set<string>>(new Set())
  const [selectedArtifactName, setSelectedArtifactName] = useState<string | null>(null)
  const [renameDialog, setRenameDialog] = useState<{
    open: boolean
    currentName: string
    newName: string
  }>({ open: false, currentName: '', newName: '' })

  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  
  const {
    activeArtifact,
    activeArtifactId,
    artifacts,
    groupedArtifacts,
    containerKey,
    isLoading,
    error: artifactError,
    loadArtifacts,
    setActiveArtifact,
    saveArtifact,
    deleteArtifact,
    clearActiveArtifact,
    getArtifactVersions,
    renameArtifactType
  } = useContainerArtifactStore()

  
  const { setTabViewMode, getActiveTab } = useTabStore()

  // Load artifacts when context changes
  useEffect(() => {
    if (context.accountName && context.databaseName && context.containerName) {
      const key = {
        accountName: context.accountName,
        resourceGroup: context.resourceGroup,
        databaseName: context.databaseName,
        containerName: context.containerName,
      }

      // Only call loadArtifacts if the container has changed or no artifacts are loaded
      if (!containerKey ||
          containerKey.accountName !== key.accountName ||
          containerKey.databaseName !== key.databaseName ||
          containerKey.containerName !== key.containerName ||
          artifacts.length === 0) {
        loadArtifacts(key)
      }
    }
  }, [context.accountName, context.resourceGroup, context.databaseName, context.containerName, containerKey, artifacts.length, loadArtifacts])

  const handleArtifactGenerated = async (newArtifact: ArtifactDefinition) => {
    if (!context.accountName || !context.databaseName || !context.containerName) return

    const key = {
      accountName: context.accountName,
      resourceGroup: context.resourceGroup,
      databaseName: context.databaseName,
      containerName: context.containerName,
    }

    await saveArtifact(key, newArtifact)
    setShowGenerator(false)
  }

  const handleArtifactUpdated = async (updatedArtifact: ArtifactDefinition) => {
    if (!containerKey) return

    await saveArtifact(containerKey, updatedArtifact)
    setShowEditor(false)
  }

  const handleToggleView = () => {
    const activeTab = getActiveTab()
    if (activeTab) {
      const newMode = viewMode === 'query' ? 'artifact' : 'query'
      setTabViewMode(activeTab.id, newMode)
    }
  }

  const handleArtifactSwitch = (artifactId: string) => {
    setActiveArtifact(artifactId)
  }

  const handleDeleteArtifact = async (artifactId: string) => {
    await deleteArtifact(artifactId)
  }

  const handleClearArtifacts = () => {
    clearActiveArtifact()
  }

  const handleToggleArtifactExpansion = (artifactName: string) => {
    setExpandedArtifactNames(prev => {
      const newSet = new Set(prev)
      if (newSet.has(artifactName)) {
        newSet.delete(artifactName)
      } else {
        newSet.add(artifactName)
      }
      return newSet
    })
  }

  const handleSelectVersion = (artifactId: string, artifactName: string) => {
    setSelectedArtifactName(artifactName)
    setActiveArtifact(artifactId)
  }

  const handleSelectLatestVersion = (artifactName: string) => {
    const artifactGroup = groupedArtifacts.find(g => g.name === artifactName)
    if (artifactGroup) {
      setActiveArtifact(artifactGroup.latestVersion.id)
    }
  }

  const handleCreateNewVersion = (artifactName: string) => {
    // Find the latest version of this artifact to refine
    const artifactGroup = groupedArtifacts.find(g => g.name === artifactName)
    if (artifactGroup) {
      // Select the latest version and open the ArtifactEditor to refine it
      setActiveArtifact(artifactGroup.latestVersion.id)
      setShowEditor(true)
    }
  }

  const handleRenameArtifact = (currentName: string) => {
    setRenameDialog({
      open: true,
      currentName,
      newName: currentName
    })
  }

  const handleConfirmRename = async () => {
    if (!renameDialog.newName.trim() || renameDialog.newName === renameDialog.currentName) {
      setRenameDialog({ open: false, currentName: '', newName: '' })
      return
    }

    try {
      await renameArtifactType(renameDialog.currentName, renameDialog.newName.trim())
      setRenameDialog({ open: false, currentName: '', newName: '' })
    } catch (error) {
      console.error('Failed to rename artifact:', error)
    }
  }

  const handleExportSuccess = () => {
    loadArtifacts({
      accountName: context.accountName,
      resourceGroup: context.resourceGroup,
      databaseName: context.databaseName,
      containerName: context.containerName,
    })
  }

  const handleImportSuccess = () => {
    loadArtifacts({
      accountName: context.accountName,
      resourceGroup: context.resourceGroup,
      databaseName: context.databaseName,
      containerName: context.containerName,
    })
  }

  const getSelectedArtifactIds = () => {
    if (selectedArtifactName) {
      // Find the latest version of the selected artifact by name
      const selectedGroup = groupedArtifacts.find(g => g.name === selectedArtifactName)
      if (selectedGroup) {
        return [selectedGroup.latestVersion.id]
      }
    }
    if (activeArtifactId) {
      return [activeArtifactId]
    }
    return []
  }


  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">
            {viewMode === 'artifact' && activeArtifact ? 'Artifact View' : 'Query Results'}
          </h3>

          {activeArtifact && (
            <button
              onClick={handleToggleView}
              className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Switch to {viewMode === 'artifact' ? 'Query' : 'Artifact'}
            </button>
          )}

          {groupedArtifacts.length > 1 && viewMode === 'artifact' && activeArtifact && (
            <select
              value={activeArtifact?.name || ''}
              onChange={(e) => e.target.value && handleSelectLatestVersion(e.target.value)}
              className="text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 px-2 py-1"
            >
              {groupedArtifacts.map((group) => (
                <option key={group.name} value={group.name}>
                  {group.name} (v{group.latestVersion.version})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!showGenerator && results && results.length > 0 && (
            <button
              onClick={() => setShowGenerator(!showGenerator)}
              className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Generate Artifact
            </button>
          )}

          {/* Export Button - Only show when there are artifacts */}
          {groupedArtifacts.length > 0 && (
            <button
              onClick={() => setShowExportDialog(true)}
              className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-300 rounded hover:bg-green-100 flex items-center gap-1"
              title="Export artifacts"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
          )}

          {/* Import Button */}
          <button
            onClick={() => setShowImportDialog(true)}
            className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-300 rounded hover:bg-purple-100 flex items-center gap-1"
            title="Import artifacts"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
          </button>

          {activeArtifact && viewMode === 'artifact' && (
            <button
              onClick={handleClearArtifacts}
              className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-300 rounded hover:bg-red-100"
            >
              Clear Artifact
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {showGenerator ? (
          <div className="w-96 border-r border-gray-200 flex-shrink-0">
            <ArtifactGenerator
              context={context}
              currentData={results || undefined}
              onArtifactGenerated={handleArtifactGenerated}
              onClose={() => setShowGenerator(false)}
            />
          </div>
        ) : showEditor && activeArtifact ? (
          <div className="w-96 border-r border-gray-200 flex-shrink-0">
            <ArtifactEditor
              artifact={activeArtifact}
              context={context}
              currentData={results || undefined}
              onArtifactUpdated={handleArtifactUpdated}
              onCancel={() => setShowEditor(false)}
            />
          </div>
        ) : groupedArtifacts.length > 0 && viewMode === 'artifact' ? (
          <div className="w-96 border-r border-gray-200 flex-shrink-0">
            <div className="h-full flex flex-col bg-gray-50">
              <div className="p-4 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Artifacts</h4>
                <p className="text-xs text-gray-700">{groupedArtifacts.length} artifact types • {artifacts.length} total versions</p>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {groupedArtifacts.map((group) => (
                  <div key={group.name} className="mb-3">
                    <div
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        activeArtifact?.name === group.name
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleToggleArtifactExpansion(group.name)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="text-sm font-medium text-gray-900 truncate">
                          {group.name}
                        </h5>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">
                            {group.versions.length} version{group.versions.length > 1 ? 's' : ''}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRenameArtifact(group.name)
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Rename artifact type"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedArtifactName(group.name)
                              setShowExportDialog(true)
                            }}
                            className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Export this artifact"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform ${
                              expandedArtifactNames.has(group.name) ? 'rotate-90' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-gray-800 line-clamp-2">
                        {group.latestVersion.description}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-700">
                          Latest: v{group.latestVersion.version}
                        </span>
                        <span className="text-xs text-gray-700">
                          {new Date(group.versions[0].updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {expandedArtifactNames.has(group.name) && (
                      <div className="ml-2 mt-1 space-y-1">
                        {/* Action button for refining current version */}
                        <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCreateNewVersion(group.name)
                            }}
                            className="w-full px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded border border-blue-200 font-medium"
                            title="Refine current version"
                          >
                            Refine This Artifact
                          </button>
                        </div>

                        {group.versions.map((version, index) => (
                          <div
                            key={version.id}
                            className={`p-2 rounded border cursor-pointer text-xs transition-colors ${
                              activeArtifactId === version.id
                                ? 'bg-blue-100 border-blue-300'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectVersion(version.id, group.name)
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  v{version.artifact.version}
                                </span>
                                {index === 0 && (
                                  <span className="text-green-600 font-medium">Latest</span>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteArtifact(version.id)
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Delete version"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <p className="text-gray-700 mt-1">
                              {new Date(version.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-200 space-y-2">
                <button
                  onClick={() => setShowGenerator(true)}
                  className="w-full px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center justify-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Generate New Artifact
                </button>

                {/* Export/Import Row */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSelectedArtifactName(null)
                      setShowExportDialog(true)
                    }}
                    className="px-2 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-300 rounded hover:bg-green-100 flex items-center justify-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export All
                  </button>

                  <button
                    onClick={() => setShowImportDialog(true)}
                    className="px-2 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-300 rounded hover:bg-purple-100 flex items-center justify-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex-1 overflow-hidden">
          {viewMode === 'artifact' && activeArtifact ? (
            <ArtifactViewer
              artifact={activeArtifact}
              data={results || []}
              loading={isLoading}
              error={error || artifactError}
              onRefresh={onRefreshQuery}
              onEdit={() => setShowEditor(true)}
            />
          ) : (
            <ResultsView results={results} metadata={metadata} error={error} />
          )}
        </div>
      </div>

      {/* Rename Artifact Dialog */}
      {renameDialog.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Rename Artifact Type
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This will rename all versions of "{renameDialog.currentName}" to "{renameDialog.newName}".
            </p>

            <div className="mb-4">
              <label htmlFor="artifact-name" className="block text-sm font-medium text-gray-900 mb-2">
                New Name
              </label>
              <input
                id="artifact-name"
                type="text"
                value={renameDialog.newName}
                onChange={(e) => setRenameDialog(prev => ({ ...prev, newName: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmRename()
                  } else if (e.key === 'Escape') {
                    setRenameDialog({ open: false, currentName: '', newName: '' })
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new artifact name"
                autoFocus
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRenameDialog({ open: false, currentName: '', newName: '' })}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRename}
                disabled={!renameDialog.newName.trim() || renameDialog.newName === renameDialog.currentName}
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      <ArtifactExportDialog
        isOpen={showExportDialog}
        onClose={() => {
          setShowExportDialog(false)
          setSelectedArtifactName(null)
        }}
        accountName={context.accountName}
        resourceGroup={context.resourceGroup}
        databaseName={context.databaseName}
        containerName={context.containerName}
        selectedArtifactIds={getSelectedArtifactIds()}
      />

      {/* Import Dialog */}
      <ArtifactImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onSuccess={handleImportSuccess}
        accountName={context.accountName}
        resourceGroup={context.resourceGroup}
        databaseName={context.databaseName}
        containerName={context.containerName}
      />
    </div>
  )
}
