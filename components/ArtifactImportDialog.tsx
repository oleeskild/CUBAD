'use client'

import { useState, useRef } from 'react'
import { XMarkIcon, ArrowUpTrayIcon, CheckIcon, ExclamationTriangleIcon, DocumentIcon } from '@heroicons/react/24/outline'
import {
  readExportFile,
  importArtifacts
} from '@/lib/storage/artifact-export-import'
import { ArtifactExportData, ImportOptions, ImportResult } from '@/types/ai'

interface ArtifactImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  accountName: string
  resourceGroup?: string
  databaseName: string
  containerName: string
}

export default function ArtifactImportDialog({
  isOpen,
  onClose,
  onSuccess,
  accountName,
  resourceGroup,
  databaseName,
  containerName
}: ArtifactImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isReading, setIsReading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [exportData, setExportData] = useState<ArtifactExportData | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    preserveIds: false,
    preserveVersions: false,
    overwriteExisting: false,
    validateCode: false
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      alert('Please select a JSON file')
      return
    }

    setSelectedFile(file)
    setIsReading(true)
    setExportData(null)
    setImportResult(null)

    try {
      const data = await readExportFile(file)
      setExportData(data)
    } catch (error) {
      setImportResult({
        success: false,
        importedArtifacts: [],
        errors: [error instanceof Error ? error.message : 'Failed to read file'],
        warnings: [],
        summary: { total: 0, imported: 0, updated: 0, skipped: 0, errors: 1 }
      })
    } finally {
      setIsReading(false)
    }
  }

  const handleImport = async () => {
    if (!exportData) return

    setIsImporting(true)
    setImportResult(null)

    try {
      const result = await importArtifacts(
        exportData,
        accountName,
        resourceGroup,
        databaseName,
        containerName,
        importOptions
      )

      setImportResult(result)

      if (result.success) {
        onSuccess?.()
        // Auto-close after successful import
        setTimeout(() => {
          handleClose()
        }, 2000)
      }
    } catch (error) {
      setImportResult({
        success: false,
        importedArtifacts: [],
        errors: [error instanceof Error ? error.message : 'Import failed'],
        warnings: [],
        summary: { total: 0, imported: 0, updated: 0, skipped: 0, errors: 1 }
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setExportData(null)
    setImportResult(null)
    setImportOptions({
      preserveIds: false,
      preserveVersions: false,
      overwriteExisting: false,
      validateCode: false
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const resetImport = () => {
    setSelectedFile(null)
    setExportData(null)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 z-[50] transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={handleClose}></div>
        </div>

        <div className="relative z-[60] inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Import Artifacts</h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* File Selection */}
              {!exportData && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Export File
                  </label>
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            ref={fileInputRef}
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept=".json"
                            onChange={handleFileSelect}
                            disabled={isReading}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">JSON files exported from this artifact system</p>
                    </div>
                  </div>

                  {isReading && (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                      <span className="text-sm text-gray-600">Reading export file...</span>
                    </div>
                  )}

                  {selectedFile && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">
                        Selected: <span className="font-medium">{selectedFile.name}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Export Data Preview */}
              {exportData && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">Export Summary</h4>
                    <button
                      onClick={resetImport}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Choose different file
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-md p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Source:</span>
                        <p className="text-gray-600">{exportData.metadata?.originalEnvironment || 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Exported:</span>
                        <p className="text-gray-600">{new Date(exportData.exportedAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Type:</span>
                        <p className="text-gray-600 capitalize">{exportData.exportType}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Artifacts:</span>
                        <p className="text-gray-600">{exportData.artifacts.length}</p>
                      </div>
                    </div>

                    {exportData.metadata?.description && (
                      <div>
                        <span className="font-medium text-gray-700">Description:</span>
                        <p className="text-gray-600">{exportData.metadata.description}</p>
                      </div>
                    )}

                    {exportData.metadata?.tags && (
                      <div>
                        <span className="font-medium text-gray-700">Tags:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {exportData.metadata.tags.map(tag => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Import Options */}
              {exportData && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Import Options</h4>

                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={importOptions.preserveIds}
                        onChange={(e) => setImportOptions(prev => ({ ...prev, preserveIds: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <span className="text-sm text-gray-700">Preserve original IDs</span>
                        <p className="text-xs text-gray-500">Keep original artifact IDs instead of generating new ones</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={importOptions.preserveVersions}
                        onChange={(e) => setImportOptions(prev => ({ ...prev, preserveVersions: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <span className="text-sm text-gray-700">Preserve version numbers</span>
                        <p className="text-xs text-gray-500">Keep original version numbers instead of resetting to 1</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={importOptions.overwriteExisting}
                        onChange={(e) => setImportOptions(prev => ({ ...prev, overwriteExisting: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <span className="text-sm text-gray-700">Overwrite existing artifacts</span>
                        <p className="text-xs text-gray-500">Replace artifacts with the same name that already exist</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={importOptions.validateCode}
                        onChange={(e) => setImportOptions(prev => ({ ...prev, validateCode: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <span className="text-sm text-gray-700">Validate React code (optional)</span>
                        <p className="text-xs text-gray-500">Check for component structure and dangerous patterns</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Import Result */}
              {importResult && (
                <div className={`rounded-md p-4 ${
                  importResult.success ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {importResult.success ? (
                        <CheckIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                      ) : (
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className={`text-sm font-medium ${
                        importResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {importResult.success ? 'Import Successful' : 'Import Failed'}
                      </h3>

                      <div className={`mt-2 text-sm ${
                        importResult.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        <div className="grid grid-cols-2 gap-4 mb-2">
                          <div>Total: {importResult.summary.total}</div>
                          <div>Imported: {importResult.summary.imported}</div>
                          <div>Updated: {importResult.summary.updated}</div>
                          <div>Skipped: {importResult.summary.skipped}</div>
                        </div>

                        {importResult.warnings.length > 0 && (
                          <div className="mt-3">
                            <p className="font-medium">Warnings:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              {importResult.warnings.map((warning, index) => (
                                <li key={index}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {importResult.errors.length > 0 && (
                          <div className="mt-3">
                            <p className="font-medium">Errors:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              {importResult.errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {exportData && !importResult?.success && (
              <button
                type="button"
                onClick={handleImport}
                disabled={isImporting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                    Import Artifacts
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {importResult?.success ? 'Close' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}