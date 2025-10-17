# Fuzzy Search Implementation

## Overview
Added intelligent fuzzy search to the command palette (⌘K) for finding accounts, databases, and containers even with typos or partial matches.

## Features

### Smart Matching Algorithm
The fuzzy search algorithm handles multiple matching strategies with scoring:

1. **Exact Match** (Score: 1000)
   - `prod` matches `prod` exactly

2. **Case-Insensitive Match** (Score: 900)
   - `PROD` matches `prod`

3. **Contains Match** (Score: 700-800)
   - `user` matches `user-container`
   - `prod` matches `myaccount-prod`
   - Higher score if match is at the start

4. **Fuzzy Match** (Score: 100-500)
   - Characters must appear in order, but can have gaps
   - `usrcnt` matches `user-container`
   - `pddb` matches `prod-database`
   - Scores based on:
     - Distance between matched characters (closer is better)
     - Total length (shorter is better)
     - Consecutive matches (more is better)

### Multi-Field Search
Searches across multiple fields simultaneously:

**Accounts**: name, location, resource group
**Databases**: id, account name
**Containers**: id, database name, account name

Returns results sorted by best match score.

## Examples

### Exact Matching
```
Search: "users"
Matches: "users" (exact)
```

### Partial Matching
```
Search: "prod"
Matches:
- "prod-account" (contains)
- "myaccount-prod" (contains)
- "production-db" (fuzzy)
```

### Fuzzy Matching (with typos/omissions)
```
Search: "usrcnt"
Matches: "user-container" (fuzzy - all chars in order)

Search: "pddb"
Matches: "prod-database" (fuzzy)

Search: "wcus"
Matches: "westus-container" (fuzzy)
```

### Multi-Word Matching
```
Search: "prod west"
Matches accounts with both terms in any field
```

## Performance

- **Fast**: Processes hundreds of items in milliseconds
- **Ranked**: Results sorted by relevance (best matches first)
- **Limited**: Returns top 10/15 results per category
- **Debounced**: 150ms delay prevents excessive filtering

## Implementation Details

### Scoring System
```
Exact match:              1000 points
Case-insensitive exact:    900 points
Contains (at start):       800 points
Contains (elsewhere):      700 points
Fuzzy match:          100-500 points
No match:                    0 points
```

### Fuzzy Algorithm
1. Characters must appear in order (left to right)
2. Calculates distance between matched characters
3. Rewards consecutive matches
4. Penalizes long distances and extra characters
5. Minimum score: 100 (for any fuzzy match)

### Usage in Code
```typescript
import { fuzzyFilter } from '@/lib/fuzzy-search'

const results = fuzzyFilter(
  items,
  searchQuery,
  (item) => [item.name, item.description], // Fields to search
  10 // Limit results
)
```

## Benefits

✅ **Forgiving**: Find items even with typos
✅ **Fast**: Instant search across hundreds of items
✅ **Smart**: Best matches appear first
✅ **Intuitive**: Works like modern search tools (VS Code, etc.)
✅ **Flexible**: Searches multiple fields simultaneously

## Files
- `lib/fuzzy-search.ts` - Fuzzy search algorithm
- `components/CommandPalette.tsx` - Integration with command palette

## Future Enhancements
- Add acronym matching (e.g., "usc" → "UserServiceContainer")
- Highlight matched characters in results
- Add keyboard shortcuts to toggle fuzzy vs exact mode
- Cache search results for even faster performance
