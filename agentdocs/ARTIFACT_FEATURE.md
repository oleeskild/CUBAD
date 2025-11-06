# Artifact Feature - AI-Generated Data Visualizations

## Overview

The Artifact feature brings Claude Desktop-style AI-generated UI components to Cubad. It allows you to automatically generate custom React components to visualize your Cosmos DB data in beautiful, interactive ways.

## Features

- **AI-Powered Generation**: Describe what you want to see, and AI generates a React component
- **Multiple Artifact Types**: Tables, cards, charts, dashboards, forms, and custom views
- **Sandboxed Rendering**: Safe iframe-based rendering with Babel compilation
- **Per-Tab State**: Each query tab can have its own artifact view
- **Persistent Storage**: Artifacts are saved in IndexedDB for reuse
- **Live Data Binding**: Artifacts automatically receive query results as props

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│  ┌──────────────┐  ┌─────────────────────────────────┐ │
│  │ Query Editor │  │   ResultsPanel                  │ │
│  └──────────────┘  │  ┌────────────────────────────┐ │ │
│  ┌──────────────┐  │  │ Query View │ Artifact View │ │ │
│  │   Generate   │──┼─▶│ Toggle between views       │ │ │
│  │   Artifact   │  │  └────────────────────────────┘ │ │
│  └──────────────┘  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
         │                           │
         ▼                           ▼
┌──────────────────┐       ┌──────────────────┐
│ AI Generate API  │       │ Artifact Storage │
│ /api/ai/artifact │       │   (IndexedDB)    │
└──────────────────┘       └──────────────────┘
         │                           │
         ▼                           ▼
┌──────────────────┐       ┌──────────────────┐
│  ArtifactViewer  │       │    TabStore      │
│  (iframe render) │       │  (artifact prop) │
└──────────────────┘       └──────────────────┘
```

## How to Use

### 1. Execute a Query

First, run a Cosmos DB query to get some data:

```sql
SELECT * FROM c WHERE c.status = 'active' OFFSET 0 LIMIT 100
```

### 2. Generate an Artifact

Once you have query results:

1. Click the **"Generate Artifact"** button in the results panel
2. Choose an artifact type (Table, Card, Chart, etc.)
3. Describe what you want to visualize in natural language
4. Press **⌘+Enter** or click **"Generate Artifact"**

Example prompts:
- "Show documents as cards with title, status badge, and timestamp"
- "Create a table with sortable columns for id, name, and createdAt"
- "Display a bar chart of document counts by status"
- "Build a dashboard with key metrics at the top and a data table below"

### 3. View Your Artifact

The AI will generate a React component and automatically:
- Switch to artifact view
- Render your component with the query data
- Save the artifact for future use

### 4. Toggle Between Views

Use the **"Switch to Query/Artifact"** button to toggle between:
- **Query View**: Traditional JSON document view
- **Artifact View**: Your custom AI-generated UI

## API Endpoints

### POST /api/ai/artifact

Generates a new artifact definition.

**Request:**
```json
{
  "prompt": "Show documents as cards with status badges",
  "context": {
    "accountName": "my-cosmos-account",
    "resourceGroup": "my-rg",
    "databaseName": "my-db",
    "containerName": "my-container"
  },
  "provider": {
    "type": "anthropic",
    "apiKey": "sk-ant-..."
  },
  "artifactType": "card",
  "sampleData": [{ "id": "1", "name": "Sample" }]
}
```

**Response:**
```json
{
  "artifact": {
    "id": "artifact-1234567890",
    "name": "Status Card View",
    "type": "card",
    "description": "Cards displaying document status",
    "code": "function ArtifactComponent({ data }) { ... }",
    "query": null,
    "createdAt": "2025-11-03T10:00:00Z",
    "updatedAt": "2025-11-03T10:00:00Z",
    "version": 1
  },
  "explanation": "Created a card grid component with status badges..."
}
```

## Component Architecture

### Key Files

#### Types (`types/ai.ts`)
```typescript
export type ArtifactType = 'table' | 'card' | 'chart' | 'form' | 'dashboard' | 'custom'

export interface ArtifactDefinition {
  id: string
  name: string
  type: ArtifactType
  description: string
  collectionContext: { ... }
  code: string // React component code
  query?: string // Optional Cosmos query
  dependencies?: string[]
  createdAt: string
  updatedAt: string
  version: number
}
```

#### Storage (`lib/storage/artifacts.ts`)
- `saveArtifact(artifact)`: Save to IndexedDB
- `getArtifact(id)`: Retrieve by ID
- `listArtifactsForContainer(...)`: Get all artifacts for a container
- `deleteArtifact(id)`: Remove artifact

#### Components

**ArtifactGenerator** (`components/ArtifactGenerator.tsx`)
- UI for describing and generating artifacts
- Type selection (table, card, chart, etc.)
- Prompt input with ⌘+Enter support
- Integration with AI API

**ArtifactViewer** (`components/ArtifactViewer.tsx`)
- Sandboxed iframe rendering
- Babel standalone for JSX compilation
- Props injection: `{ data, loading, error }`
- Error handling with user-friendly messages

**ResultsPanel** (`components/ResultsPanel.tsx`)
- Unified panel for query results and artifacts
- View mode toggle
- Generator panel integration
- Artifact management (clear, refresh)

#### Store Extension (`store/tabs.ts`)
```typescript
export interface QueryTab {
  // ... existing fields
  artifact: ArtifactDefinition | null
  viewMode: 'query' | 'artifact'
}

// New actions
setTabArtifact(tabId, artifact)
setTabViewMode(tabId, viewMode)
```

## Artifact Code Format

Generated artifacts follow this template:

```jsx
function ArtifactComponent({ data, loading, error }) {
  // Handle loading state
  if (loading) return <div className="p-4 text-gray-600">Loading...</div>;

  // Handle error state
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  // Handle empty data
  if (!data || data.length === 0) {
    return <div className="p-4 text-gray-600">No data available</div>;
  }

  // Your custom visualization
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">My Visualization</h2>
      <div className="grid grid-cols-3 gap-4">
        {data.map((item, index) => (
          <div key={index} className="border rounded p-4">
            <h3>{item.name}</h3>
            <p>{item.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Available in Artifact Sandbox

### Libraries
- **React 18**: Hooks, state management
- **Tailwind CSS**: Full utility classes
- **Standard JS APIs**: Math, Date, JSON, etc.

### React Hooks Available
- `useState`
- `useEffect`
- `useMemo`
- `useCallback`
- (All standard hooks)

### Props Injected
```typescript
interface ArtifactProps {
  data: any[]        // Query results
  loading: boolean   // Loading state
  error: string | null // Error message if any
}
```

## Security

### Sandboxing
- Artifacts run in isolated iframe
- `sandbox="allow-scripts"` attribute
- No access to parent window
- PostMessage for error reporting only

### Content Security Policy
- External scripts loaded from trusted CDNs:
  - React: unpkg.com
  - Babel: unpkg.com
  - Tailwind: cdn.tailwindcss.com

### Data Sanitization
- Sample documents have values redacted
- Only structure is shared with AI
- No sensitive data in prompts

## Limitations

### Current Limitations
1. **No External Libraries**: Only React + Tailwind (no Chart.js, D3.js, etc. yet)
2. **No Server Requests**: Artifacts can't make API calls
3. **Static Data**: Data props are read-only, no mutations
4. **Browser-Only**: Requires modern browser with iframe support

### Future Enhancements
- [ ] Chart library integration (Chart.js, Recharts)
- [ ] Export artifacts as standalone HTML
- [ ] Share artifacts between team members
- [ ] Artifact marketplace/templates
- [ ] Live data refresh without re-query
- [ ] Custom CSS/styling per artifact
- [ ] TypeScript support for artifact code
- [ ] Version history and rollback

## Troubleshooting

### "Failed to render artifact"

**Problem**: Red error message in artifact viewer

**Solutions**:
1. Check browser console for detailed error
2. Verify component syntax (missing closing tags, etc.)
3. Ensure `ArtifactComponent` function is defined
4. Check that props are accessed correctly

### "No AI provider configured"

**Problem**: Error when generating artifact

**Solution**: Go to Settings and configure an AI provider (Anthropic, OpenRouter, etc.)

### Artifact shows empty/blank

**Problem**: White screen in artifact viewer

**Solutions**:
1. Check if data prop has results
2. Verify conditional rendering logic
3. Use browser DevTools to inspect iframe
4. Look for console errors in iframe context

### TypeScript Errors

**Problem**: Build fails with type errors

**Solution**: Ensure types in `types/ai.ts` match usage in components. Run `npm run build` to verify.

## Development

### Adding New Artifact Types

1. Update `ArtifactType` in `types/ai.ts`:
```typescript
export type ArtifactType = 'table' | 'card' | 'chart' | 'my-new-type'
```

2. Add type to generator UI in `ArtifactGenerator.tsx`:
```typescript
const artifactTypes = [
  // ... existing types
  { value: 'my-new-type', label: 'My Type', icon: '🎯' }
]
```

3. Update AI prompt in `lib/ai/provider.ts` if needed

### Testing

```bash
# Build
npm run build

# Dev server
npm run dev

# Navigate to a container and test:
# 1. Execute a query
# 2. Click "Generate Artifact"
# 3. Describe a visualization
# 4. Verify rendering
```

## Example Artifacts

### Card Grid with Status Badges
```jsx
function ArtifactComponent({ data, loading, error }) {
  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!data?.length) return <div className="p-4">No data</div>;

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.inactive;
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Documents</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((doc, i) => (
          <div key={i} className="border rounded-lg p-4 hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg">{doc.name || doc.id}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(doc.status)}`}>
                {doc.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
            <div className="text-xs text-gray-500">
              {new Date(doc.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Simple Data Table
```jsx
function ArtifactComponent({ data, loading, error }) {
  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!data?.length) return <div className="p-4">No data</div>;

  const columns = Object.keys(data[0]).filter(k => !k.startsWith('_'));

  return (
    <div className="p-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(col => (
                <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col} className="px-6 py-4 text-sm text-gray-900">
                    {JSON.stringify(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## Contributing

When adding features to the artifact system:

1. **Update Types**: Modify `types/ai.ts` first
2. **Storage Layer**: Add storage functions if needed
3. **UI Components**: Create/update React components
4. **API Routes**: Add endpoints in `app/api/ai/`
5. **Documentation**: Update this file
6. **Testing**: Test with real Cosmos data

## Credits

Inspired by Claude Desktop's artifact feature from Anthropic.
