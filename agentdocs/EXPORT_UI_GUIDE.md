# Where to Find Export/Import in the UI

I've integrated the export/import functionality into your existing artifact interface. Here's exactly where to find it:

## 🎯 Main Export/Import Locations

### 1. **Header Toolbar** (Top Right)
- **Export Button** (Green) - Appears when you have artifacts in the current container
- **Import Button** (Purple) - Always available
- Located next to "Generate Artifact" and "Clear Artifact" buttons

### 2. **Individual Artifact Cards** (Sidebar)
- **Export Icon** (Green Download Arrow) - Next to each artifact name
- Hover over an artifact and click the download arrow icon to export that specific artifact
- Located next to the rename button

### 3. **Bottom Toolbar** (Artifact Sidebar)
- **Export All Button** (Green) - Export all artifacts in the container
- **Import Button** (Purple) - Import artifacts from a file
- Located below the artifact list, above "Generate New Artifact"

## 🚀 How to Use

### Export Artifacts:
1. **Single Artifact**: Click the green download arrow next to any artifact name
2. **Selected Artifacts**: Use the green "Export" button in the header toolbar
3. **All Artifacts**: Use the green "Export All" button at the bottom of the sidebar
4. **Choose Options**: Select whether to include version history
5. **Download**: File automatically downloads as `artifacts-{type}-{date}.json`

### Import Artifacts:
1. **Click Import**: Use any purple "Import" button
2. **Upload File**: Drag and drop or click to select a JSON export file
3. **Review Summary**: See what will be imported
4. **Choose Options**:
   - Preserve original IDs or generate new ones
   - Preserve version numbers or reset to 1
   - Overwrite existing artifacts or skip duplicates
   - Validate React code for security
5. **Import**: Click "Import Artifacts" to complete

## 🎨 Visual Guide

```
┌─ Header Toolbar ─────────────────────────────┐
│ Query Results          [Generate] [Export] [Import] [Clear] │
└──────────────────────────────────────────────┘

┌─ Artifact Sidebar ───────────────────────────┐
│ 📁 Artifacts (3 types • 8 total versions)    │
│ ┌─ My Chart ───────────────────────────────┐ │
│ │ v1 [Rename] [Export] ▼                   │ │
│ │ [Refine This Artifact]                   │ │
│ │ v1 Latest    [Delete]                    │ │
│ │ v2          [Delete]                    │ │
│ └─────────────────────────────────────────┘ │
│ ┌─ Sales Data ─────────────────────────────┐ │
│ │ v1 [Rename] [Export] ▼                   │ │
│ └─────────────────────────────────────────┘ │
│                                            │
│ [Generate New Artifact]                    │
│ [Export All] [Import]                      │
└────────────────────────────────────────────┘
```

## 💡 Pro Tips

1. **Quick Export**: Use the individual artifact export buttons for fastest single-artifact export
2. **Batch Export**: Use header Export button when you have specific artifacts selected
3. **Full Backup**: Use "Export All" to create complete container backups
4. **Version History**: Enable "Include version history" for complete artifact evolution
5. **Cross-Environment**: Import works between different containers, databases, or accounts
6. **Security**: Leave "Validate React code" enabled for safety

## 🔧 What Happens Behind the Scenes

- **Export**: Creates a JSON file with artifact data, metadata, and version information
- **Import**: Validates the file, updates container context, and handles duplicates based on your options
- **Auto-Refresh**: Artifacts list automatically refreshes after successful import/export
- **Error Handling**: Clear error messages guide you through any issues

The export/import functionality is now seamlessly integrated into your existing workflow - you can access it from multiple places depending on what you need to do!