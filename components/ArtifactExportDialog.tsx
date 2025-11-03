'use client'

import { useState } from 'react'
import { XMarkIcon, ArrowDownTrayIcon, CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import {
  exportSingleArtifact,
  exportBatchArtifacts,
  exportContainerArtifacts,
  downloadArtifactExport
} from '@/lib/storage/artifact-export-import'
import { ArtifactExportData } from '@/types/ai'
import { getArtifactsGroupedByName } from '@/lib/storage/container-artifacts'

interface ArtifactExportDialogProps {
  isOpen: boolean
  onClose: () => void
  accountName: string
  resourceGroup?: string
  databaseName: string
  containerName: string
  selectedArtifactIds?: string[]
}

export default function ArtifactExportDialog({
  isOpen,
  onClose,
  accountName,
  resourceGroup,
  databaseName,
  containerName,
  selectedArtifactIds = []
}: ArtifactExportDialogProps) {
  const [exportType, setExportType] = useState<'single' | 'batch' | 'container'>('batch')
  const [includeVersionHistory, setIncludeVersionHistory] = useState(false)
  const [selectedArtifacts, setSelectedArtifacts] = useState<string[]>(selectedArtifactIds)
  const [isExporting, setIsExporting] = useState(false)
  const [exportResult, setExportResult] = useState<{
    success: boolean
    message: string
    data?: ArtifactExportData
  } | null>(null)
  const [availableArtifacts, setAvailableArtifacts] = useState<any[]>([])

  // Load available artifacts when dialog opens
  const loadArtifacts = async () => {
    try {
      const artifacts = await getArtifactsGroupedByName(
        accountName,
        databaseName,
        containerName,
        resourceGroup
      )
      setAvailableArtifacts(artifacts)
    } catch (error) {
      console.error('Failed to load artifacts:', error)
    }
  }

  if (isOpen && availableArtifacts.length === 0) {
    loadArtifacts()
  }

  const handleExport = async () => {
    setIsExporting(true)
    setExportResult(null)

    try {
      let exportData: ArtifactExportData

      switch (exportType) {
        case 'single':
          if (selectedArtifacts.length !== 1) {
            throw new Error('Please select exactly one artifact for single export')
          }
          exportData = await exportSingleArtifact(
            accountName,
            resourceGroup,
            databaseName,
            containerName,
            selectedArtifacts[0],
            includeVersionHistory
          )
          break

        case 'batch':
          if (selectedArtifacts.length === 0) {
            throw new Error('Please select at least one artifact for batch export')
          }
          exportData = await exportBatchArtifacts(
            accountName,
            resourceGroup,
            databaseName,
            containerName,
            selectedArtifacts,
            includeVersionHistory
          )
          break

        case 'container':
          exportData = await exportContainerArtifacts(
            accountName,
            resourceGroup,
            databaseName,
            containerName,
            includeVersionHistory
          )
          break

        default:
          throw new Error('Invalid export type')
      }

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `artifacts-${exportType}-${timestamp}.json`

      // Download the file
      downloadArtifactExport(exportData, filename)

      setExportResult({
        success: true,
        message: `Successfully exported ${exportData.artifacts.length} artifact(s)`,
        data: exportData
      })

    } catch (error) {
      setExportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Export failed'
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleArtifactSelection = (artifactId: string, checked: boolean) => {
    if (checked) {
      setSelectedArtifacts(prev => [...prev, artifactId])
    } else {
      setSelectedArtifacts(prev => prev.filter(id => id !== artifactId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = availableArtifacts.map(a => a.latestVersion.id)
      setSelectedArtifacts(allIds)
    } else {
      setSelectedArtifacts([])
    }
  }

  const resetForm = () => {
    setExportType('batch')
    setIncludeVersionHistory(false)
    setSelectedArtifacts(selectedArtifactIds)
    setExportResult(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 z-[50] transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={handleClose}></div>
        </div>

        <div className="relative z-[60] inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Export Artifacts</h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Export Type Selection */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Type
                </label>
                <div className="relative">
                  <select
                    value={exportType}
                    onChange={(e) => setExportType(e.target.value as 'single' | 'batch' | 'container')}
                    className="block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none sm:text-sm py-2 px-3 pr-8 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    <option value="single">Single Artifact</option>
                    <option value="batch">Selected Artifacts</option>
                    <option value="container">All Artifacts in Container</option>
                  </select>

                  {/* Dropdown arrow for custom styling */}
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 8l4 4 4-4" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Artifact Selection (for single and batch) */}
              {(exportType === 'single' || exportType === 'batch') && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {exportType === 'single' ? 'Select Artifact' : 'Select Artifacts'}
                    </label>
                    {exportType === 'batch' && (
                      <button
                        onClick={() => handleSelectAll(selectedArtifacts.length !== availableArtifacts.length)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        {selectedArtifacts.length === availableArtifacts.length ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                    {availableArtifacts.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No artifacts found in this container
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {availableArtifacts.map((artifactGroup) => (
                          <div key={artifactGroup.name} className="p-3">
                            <label className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type={exportType === 'single' ? 'radio' : 'checkbox'}
                                name="artifactSelection"
                                checked={selectedArtifacts.includes(artifactGroup.latestVersion.id)}
                                onChange={(e) => handleArtifactSelection(artifactGroup.latestVersion.id, e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900">
                                  {artifactGroup.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {artifactGroup.versions.length} version(s) • {artifactGroup.latestVersion.description}
                                </div>
                              </div>
                              <div className="text-xs text-gray-400">
                                v{artifactGroup.latestVersion.version}
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {exportType === 'single' && selectedArtifacts.length !== 1 && (
                    <p className="mt-2 text-sm text-red-600">
                      Please select exactly one artifact for single export
                    </p>
                  )}
                </div>
              )}

              {/* Version History Option */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={includeVersionHistory}
                    onChange={(e) => setIncludeVersionHistory(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Include version history (all versions of each artifact)
                  </span>
                </label>
              </div>

              {/* Export Result */}
              {exportResult && (
                <div className={`rounded-md p-4 ${
                  exportResult.success ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {exportResult.success ? (
                        <CheckIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                      ) : (
                        <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm ${
                        exportResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {exportResult.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || (exportType !== 'container' && selectedArtifacts.length === 0)}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Export & Download
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}