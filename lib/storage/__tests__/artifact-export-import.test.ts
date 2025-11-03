/**
 * Test file for artifact export/import functionality
 * These tests can be run in a browser environment or with Jest + jsdom
 */

import {
  exportSingleArtifact,
  exportBatchArtifacts,
  exportContainerArtifacts,
  importArtifacts,
  downloadArtifactExport,
  validateExportData,
  readExportFile
} from '../artifact-export-import'
import { ArtifactExportData } from '@/types/ai'
import { ArtifactDefinition } from '@/types/ai'

// Mock artifact data for testing
const mockArtifact: ArtifactDefinition = {
  id: 'test-artifact-1',
  name: 'Test Artifact',
  description: 'A test artifact for unit testing',
  collectionContext: {
    accountName: 'test-account',
    databaseName: 'test-db',
    containerName: 'test-container'
  },
  code: `
import React from 'react'

export default function TestArtifact({ data, loading, error }) {
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="p-4">
      <h2>Test Artifact</h2>
      <p>Count: {data?.length || 0}</p>
    </div>
  )
}
  `,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  version: 1
}

const mockArtifactV2: ArtifactDefinition = {
  ...mockArtifact,
  id: 'test-artifact-1-v2',
  version: 2,
  updatedAt: '2024-01-02T00:00:00.000Z',
  description: 'Updated test artifact'
}

// Mock IndexedDB functions
const mockGetArtifactsForContainer = jest.fn()
const mockGetArtifactVersions = jest.fn()
const mockSaveContainerArtifact = jest.fn()
const mockGetLatestArtifactVersion = jest.fn()

// Mock the container-artifacts module
jest.mock('../container-artifacts', () => ({
  getArtifactsForContainer: () => mockGetArtifactsForContainer(),
  getArtifactVersions: () => mockGetArtifactVersions(),
  saveContainerArtifact: () => mockSaveContainerArtifact(),
  getLatestArtifactVersion: () => mockGetLatestArtifactVersion()
}))

// Mock DOM methods for download testing
const mockCreateObjectURL = jest.fn()
const mockRevokeObjectURL = jest.fn()
const mockClick = jest.fn()

Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL
  }
})

Object.defineProperty(global, 'Blob', {
  value: jest.fn().mockImplementation((content, options) => ({
    content,
    type: options.type
  }))
})

describe('Artifact Export/Import', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mock implementations
    mockGetArtifactsForContainer.mockResolvedValue([
      { id: 'test-artifact-1', artifact: mockArtifact }
    ])

    mockGetArtifactVersions.mockResolvedValue([
      { id: 'test-artifact-1', artifact: mockArtifact },
      { id: 'test-artifact-1-v2', artifact: mockArtifactV2 }
    ])

    mockGetLatestArtifactVersion.mockResolvedValue(mockArtifact)
    mockSaveContainerArtifact.mockResolvedValue(undefined)
  })

  describe('validateExportData', () => {
    it('should validate correct export data', () => {
      const validData: ArtifactExportData = {
        version: '1.0.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        exportType: 'single',
        artifacts: [
          {
            artifact: mockArtifact,
            originalId: 'test-artifact-1'
          }
        ]
      }

      const result = validateExportData(validData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing version', () => {
      const invalidData = {
        exportedAt: '2024-01-01T00:00:00.000Z',
        exportType: 'single',
        artifacts: []
      } as any

      const result = validateExportData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Missing or invalid version')
    })

    it('should detect invalid artifacts array', () => {
      const invalidData = {
        version: '1.0.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        exportType: 'single',
        artifacts: 'not-an-array'
      } as any

      const result = validateExportData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Missing or invalid artifacts array')
    })

    it('should detect missing artifact fields', () => {
      const invalidData = {
        version: '1.0.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        exportType: 'single',
        artifacts: [
          {
            artifact: {
              id: 'test',
              // Missing required fields
            }
          }
        ]
      }

      const result = validateExportData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('downloadArtifactExport', () => {
    beforeEach(() => {
      // Mock DOM methods
      document.body.appendChild = jest.fn()
      document.body.removeChild = jest.fn()

      const mockLink = {
        href: '',
        download: '',
        click: mockClick
      }

      global.document.createElement = jest.fn().mockReturnValue(mockLink)
    })

    it('should create download link and trigger download', () => {
      const exportData: ArtifactExportData = {
        version: '1.0.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        exportType: 'single',
        artifacts: [{ artifact: mockArtifact }]
      }

      downloadArtifactExport(exportData, 'test-export.json')

      expect(global.Blob).toHaveBeenCalledWith(
        [JSON.stringify(exportData, null, 2)],
        { type: 'application/json' }
      )
      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockClick).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalled()
    })
  })

  describe('readExportFile', () => {
    it('should read and validate a valid export file', async () => {
      const validData: ArtifactExportData = {
        version: '1.0.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        exportType: 'single',
        artifacts: [{ artifact: mockArtifact }]
      }

      const mockFile = new File([JSON.stringify(validData)], 'test.json', { type: 'application/json' })

      // Mock FileReader
      const mockFileReader = {
        onload: null,
        readAsText: jest.fn(),
        result: JSON.stringify(validData)
      }

      global.FileReader = jest.fn().mockImplementation(() => {
        setTimeout(() => {
          if (mockFileReader.onload) {
            mockFileReader.onload({ target: { result: JSON.stringify(validData) } })
          }
        }, 0)
        return mockFileReader
      })

      const result = await readExportFile(mockFile)
      expect(result).toEqual(validData)
    })

    it('should reject invalid JSON', async () => {
      const invalidFile = new File(['invalid json'], 'test.json', { type: 'application/json' })

      const mockFileReader = {
        onload: null,
        readAsText: jest.fn()
      }

      global.FileReader = jest.fn().mockImplementation(() => {
        setTimeout(() => {
          if (mockFileReader.onload) {
            mockFileReader.onload({ target: { result: 'invalid json' } })
          }
        }, 0)
        return mockFileReader
      })

      await expect(readExportFile(invalidFile)).rejects.toThrow('Failed to parse export file')
    })
  })

  describe('Import functionality', () => {
    it('should import artifacts with default options', async () => {
      const exportData: ArtifactExportData = {
        version: '1.0.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        exportType: 'single',
        artifacts: [{ artifact: mockArtifact }]
      }

      const result = await importArtifacts(
        exportData,
        'target-account',
        undefined,
        'target-db',
        'target-container'
      )

      expect(result.success).toBe(true)
      expect(result.summary.imported).toBe(1)
      expect(result.importedArtifacts).toHaveLength(1)
      expect(mockSaveContainerArtifact).toHaveBeenCalled()
    })

    it('should handle overwrite option', async () => {
      const exportData: ArtifactExportData = {
        version: '1.0.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        exportType: 'single',
        artifacts: [{ artifact: mockArtifact }]
      }

      // Simulate existing artifact
      mockGetLatestArtifactVersion.mockResolvedValue(mockArtifact)

      const result = await importArtifacts(
        exportData,
        'target-account',
        undefined,
        'target-db',
        'target-container',
        { overwriteExisting: true }
      )

      expect(result.success).toBe(true)
      expect(result.summary.updated).toBe(1)
      expect(mockSaveContainerArtifact).toHaveBeenCalled()
    })

    it('should skip existing artifacts when not overwriting', async () => {
      const exportData: ArtifactExportData = {
        version: '1.0.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        exportType: 'single',
        artifacts: [{ artifact: mockArtifact }]
      }

      // Simulate existing artifact
      mockGetLatestArtifactVersion.mockResolvedValue(mockArtifact)

      const result = await importArtifacts(
        exportData,
        'target-account',
        undefined,
        'target-db',
        'target-container',
        { overwriteExisting: false }
      )

      expect(result.success).toBe(true)
      expect(result.summary.skipped).toBe(1)
      expect(mockSaveContainerArtifact).not.toHaveBeenCalled()
    })
  })

  describe('Export functionality', () => {
    it('should export single artifact', async () => {
      const result = await exportSingleArtifact(
        'test-account',
        undefined,
        'test-db',
        'test-container',
        'test-artifact-1'
      )

      expect(result.version).toBe('1.0.0')
      expect(result.exportType).toBe('single')
      expect(result.artifacts).toHaveLength(1)
      expect(result.artifacts[0].artifact.name).toBe('Test Artifact')
      expect(mockGetArtifactsForContainer).toHaveBeenCalled()
    })

    it('should export batch artifacts', async () => {
      const result = await exportBatchArtifacts(
        'test-account',
        undefined,
        'test-db',
        'test-container',
        ['test-artifact-1']
      )

      expect(result.version).toBe('1.0.0')
      expect(result.exportType).toBe('batch')
      expect(result.artifacts).toHaveLength(1)
    })

    it('should export container artifacts', async () => {
      const result = await exportContainerArtifacts(
        'test-account',
        undefined,
        'test-db',
        'test-container'
      )

      expect(result.version).toBe('1.0.0')
      expect(result.exportType).toBe('container')
      expect(result.artifacts).toHaveLength(1)
    })
  })
})

// Manual testing guide for browser environment
export const manualTestGuide = `
To manually test the export/import functionality in a browser:

1. **Export Testing:**
   - Open the artifact viewer
   - Click "Export" button
   - Try different export types (single, batch, container)
   - Verify the downloaded JSON file contains valid data
   - Test with and without version history

2. **Import Testing:**
   - Use the export dialog to create a test export file
   - Open a different container or clear existing artifacts
   - Click "Import" button
   - Upload the exported file
   - Try different import options
   - Verify artifacts are imported correctly

3. **Cross-Environment Testing:**
   - Export from one container/account
   - Import to a different container/account
   - Verify the collection context is updated correctly

4. **Error Handling:**
   - Try importing invalid JSON files
   - Try importing files with missing required fields
   - Test with dangerous React code patterns
   - Verify appropriate error messages are shown

5. **Version Management:**
   - Export artifacts with multiple versions
   - Import with different version preservation options
   - Verify version numbers are handled correctly
`