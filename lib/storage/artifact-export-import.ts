import {
  ArtifactDefinition,
  ArtifactExportData,
  ExportedArtifact,
  ImportOptions,
  ImportResult,
  ContainerArtifactKey
} from '@/types/ai'
import {
  getArtifactsForContainer,
  getArtifactVersions,
  saveContainerArtifact,
  getLatestArtifactVersion,
  ContainerArtifactKey as StorageKey
} from './container-artifacts'

const EXPORT_FORMAT_VERSION = '1.0.0'

/**
 * Export a single artifact
 */
export async function exportSingleArtifact(
  accountName: string,
  resourceGroup: string | undefined,
  databaseName: string,
  containerName: string,
  artifactId: string,
  includeVersionHistory: boolean = false
): Promise<ArtifactExportData> {
  try {
    // Get the specific artifact
    const allArtifacts = await getArtifactsForContainer(
      accountName,
      databaseName,
      containerName,
      resourceGroup
    )

    const targetArtifact = allArtifacts.find(a => a.id === artifactId)
    if (!targetArtifact) {
      throw new Error(`Artifact with ID ${artifactId} not found`)
    }

    let artifacts: ExportedArtifact[] = [{
      artifact: targetArtifact.artifact,
      originalId: targetArtifact.id,
      exportMetadata: {
        originalContainer: {
          accountName,
          resourceGroup,
          databaseName,
          containerName
        },
        versionHistory: false
      }
    }]

    // If version history is requested, get all versions
    if (includeVersionHistory) {
      const versions = await getArtifactVersions(
        accountName,
        databaseName,
        containerName,
        targetArtifact.artifact.name,
        resourceGroup
      )

      artifacts = versions.map(version => ({
        artifact: version.artifact,
        originalId: version.id,
        exportMetadata: {
          originalContainer: {
            accountName,
            resourceGroup,
            databaseName,
            containerName
          },
          versionHistory: true
        }
      }))
    }

    return {
      version: EXPORT_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      exportType: 'single',
      artifacts,
      metadata: {
        originalEnvironment: `${accountName}/${resourceGroup || 'no-rg'}/${databaseName}/${containerName}`,
        description: `Exported artifact: ${targetArtifact.artifact.name}`,
        tags: includeVersionHistory ? ['version-history'] : ['single']
      }
    }
  } catch (error) {
    throw new Error(`Failed to export artifact: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Export multiple artifacts (batch)
 */
export async function exportBatchArtifacts(
  accountName: string,
  resourceGroup: string | undefined,
  databaseName: string,
  containerName: string,
  artifactIds: string[],
  includeVersionHistory: boolean = false
): Promise<ArtifactExportData> {
  try {
    const allArtifacts = await getArtifactsForContainer(
      accountName,
      databaseName,
      containerName,
      resourceGroup
    )

    const exportedArtifacts: ExportedArtifact[] = []
    const artifactNames = new Set<string>()

    for (const artifactId of artifactIds) {
      const targetArtifact = allArtifacts.find(a => a.id === artifactId)
      if (!targetArtifact) {
        console.warn(`Artifact with ID ${artifactId} not found, skipping...`)
        continue
      }

      artifactNames.add(targetArtifact.artifact.name)

      if (includeVersionHistory) {
        const versions = await getArtifactVersions(
          accountName,
          databaseName,
          containerName,
          targetArtifact.artifact.name,
          resourceGroup
        )

        versions.forEach(version => {
          exportedArtifacts.push({
            artifact: version.artifact,
            originalId: version.id,
            exportMetadata: {
              originalContainer: {
                accountName,
                resourceGroup,
                databaseName,
                containerName
              },
              versionHistory: true
            }
          })
        })
      } else {
        exportedArtifacts.push({
          artifact: targetArtifact.artifact,
          originalId: targetArtifact.id,
          exportMetadata: {
            originalContainer: {
              accountName,
              resourceGroup,
              databaseName,
              containerName
            },
            versionHistory: false
          }
        })
      }
    }

    return {
      version: EXPORT_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      exportType: 'batch',
      artifacts: exportedArtifacts,
      metadata: {
        originalEnvironment: `${accountName}/${resourceGroup || 'no-rg'}/${databaseName}/${containerName}`,
        description: `Batch export of ${artifactNames.size} artifacts`,
        tags: includeVersionHistory ? ['batch', 'version-history'] : ['batch']
      }
    }
  } catch (error) {
    throw new Error(`Failed to export batch artifacts: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Export all artifacts from a container
 */
export async function exportContainerArtifacts(
  accountName: string,
  resourceGroup: string | undefined,
  databaseName: string,
  containerName: string,
  includeVersionHistory: boolean = false
): Promise<ArtifactExportData> {
  try {
    const allArtifacts = await getArtifactsForContainer(
      accountName,
      databaseName,
      containerName,
      resourceGroup
    )

    const exportedArtifacts: ExportedArtifact[] = []
    const processedNames = new Set<string>()

    for (const artifactRecord of allArtifacts) {
      const artifactName = artifactRecord.artifact.name

      if (includeVersionHistory && !processedNames.has(artifactName)) {
        // Get all versions for this artifact
        const versions = await getArtifactVersions(
          accountName,
          databaseName,
          containerName,
          artifactName,
          resourceGroup
        )

        versions.forEach(version => {
          exportedArtifacts.push({
            artifact: version.artifact,
            originalId: version.id,
            exportMetadata: {
              originalContainer: {
                accountName,
                resourceGroup,
                databaseName,
                containerName
              },
              versionHistory: true
            }
          })
        })

        processedNames.add(artifactName)
      } else if (!includeVersionHistory) {
        // Just add the current version
        exportedArtifacts.push({
          artifact: artifactRecord.artifact,
          originalId: artifactRecord.id,
          exportMetadata: {
            originalContainer: {
              accountName,
              resourceGroup,
              databaseName,
              containerName
            },
            versionHistory: false
          }
        })
      }
    }

    return {
      version: EXPORT_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      exportType: 'container',
      artifacts: exportedArtifacts,
      metadata: {
        originalEnvironment: `${accountName}/${resourceGroup || 'no-rg'}/${databaseName}/${containerName}`,
        description: `Full container export: ${containerName}`,
        tags: includeVersionHistory ? ['container', 'version-history'] : ['container']
      }
    }
  } catch (error) {
    throw new Error(`Failed to export container artifacts: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Download export data as JSON file
 */
export function downloadArtifactExport(exportData: ArtifactExportData, filename?: string): void {
  const json = JSON.stringify(exportData, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const defaultFilename = `artifacts-export-${new Date().toISOString().split('T')[0]}.json`
  const finalFilename = filename || defaultFilename

  const link = document.createElement('a')
  link.href = url
  link.download = finalFilename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Validate exported artifact data
 */
export function validateExportData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    errors.push('Invalid data format')
    return { isValid: false, errors }
  }

  if (!data.version || typeof data.version !== 'string') {
    errors.push('Missing or invalid version')
  }

  if (!data.exportedAt || typeof data.exportedAt !== 'string') {
    errors.push('Missing or invalid exportedAt timestamp')
  }

  if (!data.exportType || !['single', 'batch', 'container'].includes(data.exportType)) {
    errors.push('Missing or invalid exportType')
  }

  if (!Array.isArray(data.artifacts)) {
    errors.push('Missing or invalid artifacts array')
  } else {
    data.artifacts.forEach((artifact: any, index: number) => {
      if (!artifact.artifact || typeof artifact.artifact !== 'object') {
        errors.push(`Artifact ${index + 1}: Missing artifact data`)
      } else {
        const requiredFields = ['id', 'name', 'description', 'code', 'createdAt', 'updatedAt', 'version']
        requiredFields.forEach(field => {
          if (!artifact.artifact[field]) {
            errors.push(`Artifact ${index + 1}: Missing required field '${field}'`)
          }
        })
      }
    })
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * Import artifacts from export data
 */
export async function importArtifacts(
  exportData: ArtifactExportData,
  targetAccountName: string,
  targetResourceGroup: string | undefined,
  targetDatabaseName: string,
  targetContainerName: string,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    importedArtifacts: [],
    errors: [],
    warnings: [],
    summary: {
      total: exportData.artifacts.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    }
  }

  const {
    preserveIds = false,
    preserveVersions = false,
    overwriteExisting = false,
    validateCode = false
  } = options

  try {
    // Validate export data first
    const validation = validateExportData(exportData)
    if (!validation.isValid) {
      throw new Error(`Invalid export data: ${validation.errors.join(', ')}`)
    }

    // Group artifacts by name to handle versions properly
    const artifactsByName = exportData.artifacts.reduce((acc, exported) => {
      const name = exported.artifact.name
      if (!acc[name]) {
        acc[name] = []
      }
      acc[name].push(exported)
      return acc
    }, {} as Record<string, ExportedArtifact[]>)

    // Process each artifact group
    for (const [artifactName, versions] of Object.entries(artifactsByName)) {
      try {
        // Sort versions by version number (ascending for proper import)
        versions.sort((a, b) => a.artifact.version - b.artifact.version)

        for (const exportedArtifact of versions) {
          const importResult = await importSingleArtifact(
            exportedArtifact,
            targetAccountName,
            targetResourceGroup,
            targetDatabaseName,
            targetContainerName,
            {
              preserveIds,
              preserveVersions,
              overwriteExisting,
              validateCode
            }
          )

          result.importedArtifacts.push(importResult)

          // Update counters
          if (importResult.status === 'imported') {
            result.summary.imported++
          } else if (importResult.status === 'updated') {
            result.summary.updated++
          } else if (importResult.status === 'skipped') {
            result.summary.skipped++
          } else if (importResult.status === 'error') {
            result.summary.errors++
            result.errors.push(`Error importing ${importResult.name}: ${importResult.error}`)
          }
        }
      } catch (error) {
        const errorMsg = `Failed to import artifact group '${artifactName}': ${error instanceof Error ? error.message : 'Unknown error'}`
        result.errors.push(errorMsg)
        result.summary.errors += versions.length
      }
    }

    // Add warnings for important conditions
    if (!preserveVersions) {
      result.warnings.push('Version numbers were reset to 1 for imported artifacts')
    }

    if (!preserveIds) {
      result.warnings.push('New IDs were generated for imported artifacts')
    }

    // Check if target container is different from original
    const originalEnv = exportData.metadata?.originalEnvironment
    const targetEnv = `${targetAccountName}/${targetResourceGroup || 'no-rg'}/${targetDatabaseName}/${targetContainerName}`
    if (originalEnv && originalEnv !== targetEnv) {
      result.warnings.push(`Artifacts were imported to a different container environment`)
    }

    result.success = result.summary.errors === 0

  } catch (error) {
    result.success = false
    result.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

/**
 * Import a single artifact
 */
async function importSingleArtifact(
  exportedArtifact: ExportedArtifact,
  targetAccountName: string,
  targetResourceGroup: string | undefined,
  targetDatabaseName: string,
  targetContainerName: string,
  options: Required<Pick<ImportOptions, 'preserveIds' | 'preserveVersions' | 'overwriteExisting' | 'validateCode'>>
): Promise<{ originalId?: string; newId: string; name: string; status: 'imported' | 'updated' | 'skipped' | 'error'; error?: string }> {
  const { artifact, originalId } = exportedArtifact

  try {
    // Validate React code if requested
    if (options.validateCode) {
      const codeValidation = validateReactCode(artifact.code)
      if (!codeValidation.isValid) {
        return {
          originalId,
          newId: '',
          name: artifact.name,
          status: 'error',
          error: `Invalid React code: ${codeValidation.errors.join(', ')}`
        }
      }
    }

    // Create target container key
    const targetKey: StorageKey = {
      accountName: targetAccountName,
      resourceGroup: targetResourceGroup,
      databaseName: targetDatabaseName,
      containerName: targetContainerName
    }

    // Check if artifact with same name already exists
    const existingArtifact = await getLatestArtifactVersion(
      targetAccountName,
      targetDatabaseName,
      targetContainerName,
      artifact.name,
      targetResourceGroup
    )

    // Create the artifact to import
    let artifactToImport: ArtifactDefinition = {
      ...artifact,
      collectionContext: targetKey,
      createdAt: options.preserveVersions ? artifact.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Handle ID preservation
    if (!options.preserveIds) {
      // Generate new ID
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 8)
      artifactToImport.id = `${artifact.name}-${timestamp}-${random}`
    }

    // Handle version preservation
    if (!options.preserveVersions) {
      artifactToImport.version = 1
    }

    // Handle existing artifact
    if (existingArtifact) {
      if (!options.overwriteExisting) {
        return {
          originalId,
          newId: existingArtifact.id,
          name: artifact.name,
          status: 'skipped'
        }
      }

      // If overwriting, ensure version is higher than existing
      if (options.preserveVersions && artifactToImport.version <= existingArtifact.version) {
        artifactToImport.version = existingArtifact.version + 1
      }
    }

    // Save the artifact
    await saveContainerArtifact(targetKey, artifactToImport)

    return {
      originalId,
      newId: artifactToImport.id,
      name: artifact.name,
      status: existingArtifact ? 'updated' : 'imported'
    }

  } catch (error) {
    return {
      originalId,
      newId: '',
      name: artifact.name,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Basic React code validation
 */
function validateReactCode(code: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Basic checks
  if (!code.trim()) {
    errors.push('Code is empty')
    return { isValid: false, errors }
  }

  // Check for required React elements
  if (!code.includes('return')) {
    errors.push('Component must have a return statement')
  }

  // Check that the component is named "ArtifactComponent" (required by the system)
  const hasArtifactComponent = /ArtifactComponent/.test(code)
  if (!hasArtifactComponent) {
    errors.push('Component must be named "ArtifactComponent"')
  }

  // Check for function or class definition for ArtifactComponent
  const hasArtifactComponentDefinition =
    /function\s+ArtifactComponent|const\s+ArtifactComponent\s*=|class\s+ArtifactComponent/.test(code)
  if (!hasArtifactComponentDefinition) {
    errors.push('Must define ArtifactComponent as a function, const, or class')
  }

  // Only check for truly dangerous patterns that could break the sandbox
  // Most patterns are allowed since the component runs in a sandboxed iframe
  const dangerousPatterns = [
    /eval\s*\(/,
    /Function\s*\(/,
  ]

  dangerousPatterns.forEach(pattern => {
    if (pattern.test(code)) {
      errors.push(`Potentially dangerous code pattern detected: ${pattern.source}`)
    }
  })

  return { isValid: errors.length === 0, errors }
}

/**
 * Read and parse export data from file
 */
export async function readExportFile(file: File): Promise<ArtifactExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const data = JSON.parse(content)
        const validation = validateExportData(data)

        if (!validation.isValid) {
          reject(new Error(`Invalid export file: ${validation.errors.join(', ')}`))
          return
        }

        resolve(data as ArtifactExportData)
      } catch (error) {
        reject(new Error(`Failed to parse export file: ${error instanceof Error ? error.message : 'Unknown error'}`))
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}