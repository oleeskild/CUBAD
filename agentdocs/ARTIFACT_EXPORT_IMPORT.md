# Artifact Export/Import System

This document describes the export/import functionality that allows you to share artifacts between different environments and users.

## Overview

The export/import system enables you to:
- Export single artifacts, selected batches, or entire containers
- Share artifacts with team members or across different environments
- Import artifacts with flexible options for handling duplicates
- Preserve or reset version numbers and IDs as needed
- Include complete version history for comprehensive sharing

## Features

### Export Functionality
- **Single Artifact Export**: Export one specific artifact
- **Batch Export**: Export multiple selected artifacts
- **Container Export**: Export all artifacts in a container
- **Version History**: Option to include all versions of each artifact
- **JSON Format**: Standardized, human-readable export format
- **Automatic Download**: Direct file download to user's device

### Import Functionality
- **File Upload**: Simple drag-and-drop or click-to-upload interface
- **Validation**: Built-in validation for security and data integrity
- **Flexible Options**: Multiple import strategies for different use cases
- **Duplicate Handling**: Options to skip, overwrite, or update existing artifacts
- **Cross-Environment**: Works between different containers, databases, and accounts
- **Progress Tracking**: Real-time feedback on import progress and results

### Import Options

| Option | Default | Description |
|--------|---------|-------------|
| Preserve IDs | `false` | Keep original artifact IDs instead of generating new ones |
| Preserve Versions | `false` | Keep original version numbers instead of resetting to 1 |
| Overwrite Existing | `false` | Replace artifacts with the same name that already exist |
| Validate Code | `true` | Check for potentially dangerous code patterns |

## Data Format

### Export Structure

```typescript
interface ArtifactExportData {
  version: string           // Export format version (e.g., "1.0.0")
  exportedAt: string        // ISO timestamp when exported
  exportType: 'single' | 'batch' | 'container'
  artifacts: ExportedArtifact[]
  metadata?: {
    originalEnvironment?: string  // Original container path
    description?: string          // Export description
    tags?: string[]              // Export tags
  }
}

interface ExportedArtifact {
  artifact: ArtifactDefinition  // The artifact data
  originalId?: string           // Original ID for reference
  exportMetadata?: {
    originalContainer?: ContainerArtifactKey
    versionHistory?: boolean     // Whether this includes all versions
  }
}
```

### File Naming Convention

Exported files are automatically named with the following pattern:
```
artifacts-{exportType}-{YYYY-MM-DD}.json
```

Examples:
- `artifacts-single-2024-01-15.json`
- `artifacts-batch-2024-01-15.json`
- `artifacts-container-2024-01-15.json`

## Usage

### Basic Integration

```tsx
import ArtifactManager from '@/components/ArtifactManager'

function MyArtifactComponent() {
  return (
    <ArtifactManager
      accountName="your-account"
      resourceGroup="your-resource-group"
      databaseName="your-database"
      containerName="your-container"
      selectedArtifactIds={selectedIds}
      onRefresh={handleRefresh}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onView={handleView}
    />
  )
}
```

### Standalone Export Dialog

```tsx
import ArtifactExportDialog from '@/components/ArtifactExportDialog'

function ExportExample() {
  const [showExport, setShowExport] = useState(false)

  return (
    <>
      <button onClick={() => setShowExport(true)}>
        Export Artifacts
      </button>

      <ArtifactExportDialog
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        accountName="your-account"
        resourceGroup="your-resource-group"
        databaseName="your-database"
        containerName="your-container"
        selectedArtifactIds={selectedIds}
      />
    </>
  )
}
```

### Standalone Import Dialog

```tsx
import ArtifactImportDialog from '@/components/ArtifactImportDialog'

function ImportExample() {
  const [showImport, setShowImport] = useState(false)

  return (
    <>
      <button onClick={() => setShowImport(true)}>
        Import Artifacts
      </button>

      <ArtifactImportDialog
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={handleImportSuccess}
        accountName="your-account"
        resourceGroup="your-resource-group"
        databaseName="your-database"
        containerName="your-container"
      />
    </>
  )
}
```

### Programmatic Export

```typescript
import {
  exportSingleArtifact,
  exportBatchArtifacts,
  exportContainerArtifacts,
  downloadArtifactExport
} from '@/lib/storage/artifact-export-import'

// Export single artifact
const exportData = await exportSingleArtifact(
  accountName, resourceGroup, databaseName, containerName,
  artifactId, includeVersionHistory
)

// Download the file
downloadArtifactExport(exportData, 'my-artifacts.json')
```

### Programmatic Import

```typescript
import {
  readExportFile,
  importArtifacts
} from '@/lib/storage/artifact-export-import'

// Read and validate file
const exportData = await readExportFile(file)

// Import with options
const result = await importArtifacts(
  exportData,
  targetAccountName, targetResourceGroup, targetDatabaseName, targetContainerName,
  {
    preserveIds: false,
    preserveVersions: false,
    overwriteExisting: true,
    validateCode: true
  }
)

console.log(`Imported ${result.summary.imported} artifacts`)
```

## Security Features

### Code Validation
The system includes built-in validation to detect potentially dangerous React code patterns:
- `eval()` and `Function()` constructors
- Direct DOM manipulation (`document.*`, `window.*`)
- Storage access (`localStorage.*`, `sessionStorage.*`)
- Network requests (`fetch()`, `XMLHttpRequest`)
- Timers (`setTimeout()`, `setInterval()`)

### Data Sanitization
- Export data is validated before processing
- Import data is validated against expected schema
- Container contexts are updated for target environment
- IDs can be regenerated to prevent conflicts

## Use Cases

### 1. Team Collaboration
- Export artifacts from development environment
- Share with team members via file sharing
- Import into staging or production environments

### 2. Environment Migration
- Export all artifacts from one container
- Import into a new container or account
- Preserve version history for complete migration

### 3. Backup and Recovery
- Regular exports of important artifacts
- Import to recover from data loss
- Maintain version history for rollback capabilities

### 4. Template Sharing
- Export template artifacts
- Share with other teams or projects
- Import as starting points for new visualizations

## Error Handling

The system provides comprehensive error handling:

### Export Errors
- Artifact not found
- Permission issues
- Storage quota exceeded
- Network connectivity problems

### Import Errors
- Invalid file format
- Corrupted JSON data
- Missing required fields
- Code validation failures
- Storage quota exceeded
- Permission issues

### Validation Errors
- Missing required artifact fields
- Invalid export format version
- Malformed JSON structure
- Dangerous code patterns detected

## Best Practices

### Export Best Practices
1. **Include Version History**: When sharing complete solutions, include version history
2. **Descriptive Names**: Use clear file names that indicate content and date
3. **Regular Backups**: Export important artifacts regularly for backup
4. **Verify Exports**: Check exported files contain expected data before sharing

### Import Best Practices
1. **Test Imports**: Import to non-production environment first
2. **Review Options**: Choose appropriate import options for your use case
3. **Check Conflicts**: Review duplicate handling before importing
4. **Validate Results**: Verify imported artifacts work as expected after import

### Security Best Practices
1. **Validate Code**: Always validate React code during import
2. **Review Sources**: Only import artifacts from trusted sources
3. **Check Permissions**: Ensure you have appropriate permissions for target container
4. **Monitor Storage**: Watch storage quotas when importing large batches

## Troubleshooting

### Common Issues

**Q: Import fails with "Invalid export file" error**
A: Check that the file is a valid JSON file exported from this system. Verify the file hasn't been manually edited.

**Q: Artifacts appear with wrong container context**
A: This is expected behavior. Artifacts are automatically updated to use the target container context during import.

**Q: Version numbers are reset to 1**
A: This is the default behavior. Enable "Preserve version numbers" option during import to maintain original versions.

**Q: Import skips existing artifacts**
A: This is the default behavior to prevent accidental overwrites. Enable "Overwrite existing artifacts" option to replace existing artifacts.

**Q: Large exports fail to download**
A: Browser download limitations may affect very large exports. Consider exporting in smaller batches or excluding version history.

### Debug Mode

For development and debugging, you can access the internal functions:

```typescript
import { validateExportData } from '@/lib/storage/artifact-export-import'

// Validate export data
const validation = validateExportData(exportData)
console.log('Validation errors:', validation.errors)
```

## File Structure

```
lib/storage/
├── artifact-export-import.ts    # Core export/import functionality
├── container-artifacts.ts       # Existing artifact storage
└── __tests__/
    └── artifact-export-import.test.ts  # Test suite

components/
├── ArtifactExportDialog.tsx     # Export UI component
├── ArtifactImportDialog.tsx     # Import UI component
├── ArtifactManager.tsx          # Management toolbar
└── ArtifactExportImportDemo.tsx # Demo component

types/ai.ts                      # Updated with export/import types
```

## Version History

### v1.0.0
- Initial implementation of export/import system
- Single, batch, and container export functionality
- Flexible import options with validation
- Cross-environment support
- Security features and code validation
- Comprehensive UI components

## Contributing

When extending the export/import functionality:

1. **Update Types**: Add new types to `types/ai.ts`
2. **Maintain Compatibility**: Ensure backward compatibility with existing export files
3. **Add Tests**: Include comprehensive tests for new functionality
4. **Update Documentation**: Keep this README and inline comments current
5. **Security Review**: Consider security implications of new features

## License

This export/import system is part of the larger artifact system and follows the same licensing terms.