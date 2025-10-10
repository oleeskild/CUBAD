# New Features: Tabs and Collapsible Sidebars

## Overview
Added multi-tab support for queries and collapsible sidebars to maximize workspace.

## Features

### 1. Multi-Tab Query Editor
- **Multiple queries**: Open multiple query tabs simultaneously
- **Cross-container tabs**: Each tab can query different accounts/databases/containers
- **Auto-tab creation**: First tab is created automatically when you select a container
- **Manual tab creation**: Click the `+` button in the tab bar to add more tabs
- **Tab context**: Each tab remembers its account/database/container context
- **Independent results**: Each tab stores its own query results, metadata, and errors
- **Tab switching**: Click tabs or use them to switch between queries

#### Tab Display
- Tab name shows full path: `account/database/container`
- Active tab is highlighted
- Close button appears on hover
- Tabs persist their query text and results when switching

### 2. Collapsible Sidebars
- **Three collapsible sidebars**: Accounts, Databases, Containers
- **Independent collapse**: Each sidebar can be collapsed independently
- **Collapsed view**: Shows as thin bar with expand button
- **More workspace**: Collapse sidebars to maximize query editor space
- **Persistent titles**: Sidebar titles shown even when expanded

#### Usage
- Click the arrow icon in the sidebar header to collapse/expand
- When collapsed, click the arrow button to expand again
- Collapsed sidebars are only 40px wide (vs 256px expanded)

### 3. Resizable Panels
- Drag the horizontal divider between editor and results
- Resize anywhere between 20% and 80%
- Visual feedback on hover and while dragging
- Smooth resizing experience

## File Structure

### New Files
```
store/tabs.ts                    # Zustand store for tab management
components/TabBar.tsx            # Tab navigation component
components/CollapsibleSidebar.tsx # Collapsible sidebar wrapper
```

### Modified Files
```
components/QueryEditor.tsx       # Updated to work with tabs
app/page.tsx                     # Integrated tabs and collapsible sidebars
```

## Technical Details

### Tab Store (`store/tabs.ts`)
```typescript
interface QueryTab {
  id: string
  name: string
  accountName: string | null
  accountResourceGroup: string | null
  databaseName: string | null
  containerName: string | null
  query: string
  results: any[] | null
  metadata: any | null
  error: string | null
}
```

**Actions:**
- `addTab(context?)` - Create new tab with optional context
- `closeTab(tabId)` - Close a tab and switch to another
- `setActiveTab(tabId)` - Switch to a tab
- `updateTab(tabId, updates)` - Update tab properties
- `updateTabQuery(tabId, query)` - Update just the query
- `updateTabResults(tabId, results, metadata, error)` - Update query results
- `getActiveTab()` - Get currently active tab

### Tab Workflow

1. User selects a container
2. First tab is created automatically with that container's context
3. User can add more tabs with the `+` button
4. Each tab stores its own:
   - Query text
   - Container context (account/database/container)
   - Results and metadata
   - Error state
5. Switching tabs loads that tab's query and results
6. Executing a query updates only the active tab's results

### Sidebar Collapse State

Each sidebar has independent collapse state stored in React state:
- `accountsCollapsed`
- `databasesCollapsed`
- `containersCollapsed`

Could be persisted to localStorage in the future.

## Keyboard Shortcuts

Existing shortcuts still work:
- `⌘K` / `Ctrl+K` - Open command palette
- `⌘Enter` / `Ctrl+Enter` - Execute query in active tab
- `h` / `l` - Navigate between panels
- `j` / `k` - Navigate items in lists

## Future Enhancements

- **Keyboard shortcuts for tabs**: `⌘1-9` to switch tabs, `⌘T` for new tab, `⌘W` to close
- **Drag to reorder tabs**: Rearrange tabs by dragging
- **Duplicate tab**: Right-click menu to duplicate a tab
- **Save tab session**: Persist tabs across browser sessions
- **Tab search**: Search through open tabs when you have many
- **Pin tabs**: Keep important tabs always visible
- **Tab groups**: Group related tabs together

## Usage Examples

### Multiple Queries Across Containers
1. Select `account1/db1/container1` → Tab 1 opens
2. Click `+` to add tab
3. Select `account2/db2/container2` (from command palette or sidebar)
4. Now you have two tabs, each querying different containers
5. Switch between tabs to see different results

### Maximize Workspace
1. Collapse all three sidebars (click arrow in each header)
2. Sidebars reduce to thin 40px bars
3. Query editor and results now use almost full screen width
4. Expand sidebars when you need to navigate again

### Multi-Query Workflow
1. Open tab for `users` container
2. Run `SELECT * FROM c WHERE c.status = 'active'`
3. Add new tab, query same container
4. Run `SELECT * FROM c WHERE c.createdAt > '2024-01-01'`
5. Compare results side-by-side by switching tabs
6. Each tab maintains its own results

## Benefits

✅ **Productivity**: Work on multiple queries without losing context
✅ **Flexibility**: Query different containers simultaneously
✅ **Space**: Collapse sidebars when you need more room
✅ **Organization**: Keep related queries in separate tabs
✅ **Comparison**: Easy to compare query results across tabs
✅ **Focus**: Hide navigation when you're focused on querying

## Migration Notes

- **No breaking changes**: Existing functionality still works
- **Automatic tab creation**: First tab is created when you select a container
- **State management**: Query state moved from local state to tab store
- **Results storage**: Results now stored per-tab instead of globally
