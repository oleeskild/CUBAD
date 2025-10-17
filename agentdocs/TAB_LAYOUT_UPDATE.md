# Tab Layout Update

## Changes Made

Updated the tab bar to display cleaner, more readable tab names with a two-line layout:

### Visual Layout

```
┌─────────────────────────────────────┐
│ [icon] ContainerName          [×]  │  ← Main title (bold)
│        account / database           │  ← Subtitle (smaller, gray)
└─────────────────────────────────────┘
```

## Features

### 1. **Two-Line Tab Display**
- **Line 1 (Title)**: Container name only (bold, medium font)
- **Line 2 (Subtitle)**: Account / Database path (smaller, gray)

### 2. **Display Filter Integration**
- Container names use display filters (regex rules from settings)
- Account and database names also filtered
- Cleaner, shorter names throughout

### 3. **Better Space Usage**
- Tabs are slightly taller but much narrower
- More tabs visible in the tab bar
- Better use of horizontal space

## Examples

### Before (Long, Hard to Read)
```
myaccount-prod-westus/mydb-production/user-container
```

### After (Clean, Two Lines)
```
user-container
myaccount-prod / mydb-production
```

### With Display Filters Applied
If you have filters like:
- Pattern: `-production$` → Replacement: `-prod`
- Pattern: `-westus$` → Replacement: ``

Result:
```
user-container
myaccount-prod / mydb-prod
```

## UI Improvements

1. **Container icon**: Changed from code icon to database/container icon for clarity
2. **Vertical layout**: Tabs now have a natural two-line structure
3. **Truncation**: Both lines truncate with ellipsis if too long
4. **Tooltips**: Hover shows full names for both lines
5. **Close button**: Still appears on hover in the top-right

## Responsive Behavior

- **Max width**: 384px (24rem) per tab
- **Truncation**: Long names show "..." with full text in tooltip
- **Scrolling**: Tab bar scrolls horizontally if many tabs are open

## Technical Details

### Display Filter Function
```typescript
const getTabTitle = (tab: QueryTab): string => {
  if (tab.containerName) {
    return applyDisplayFilters(tab.containerName, 'container')
  }
  return tab.name
}

const getTabSubtitle = (tab: QueryTab): string | null => {
  if (tab.accountName && tab.databaseName && tab.containerName) {
    const account = applyDisplayFilters(tab.accountName, 'database')
    const database = applyDisplayFilters(tab.databaseName, 'database')
    return `${account} / ${database}`
  }
  return null
}
```

### CSS Classes
- Title: `text-sm font-medium` (14px, medium weight)
- Subtitle: `text-xs text-gray-500` (12px, gray)
- Container: `flex flex-col` (vertical stacking)

## Benefits

✅ **Readability**: Container name is immediately visible
✅ **Context**: Account/database shown but not overwhelming
✅ **Consistency**: Display filters applied everywhere
✅ **Space**: More tabs fit on screen
✅ **Clarity**: Visual hierarchy with bold title and gray subtitle

## Files Changed

- `components/TabBar.tsx` - Updated tab rendering and added display filters
