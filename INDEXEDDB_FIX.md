# IndexedDB Constraint Violation Fix

## Problem
When building the search index, got error:
```
A mutation operation in the transaction failed because a constraint was not satisfied
AbortError
```

## Root Cause
The IndexedDB stores for `databases` and `containers` were using `id` as the keyPath, but:
- **Database IDs** are only unique within an account (e.g., multiple accounts can have a database named "mydb")
- **Container IDs** are only unique within a database (e.g., multiple databases can have a container named "users")

This caused **duplicate key violations** when trying to insert databases/containers with the same ID from different accounts.

## Solution
Changed to **composite keys** that guarantee uniqueness:

### Database Store
- **Old keyPath**: `id` (not unique across accounts)
- **New keyPath**: `_key` (composite: `accountName/databaseId`)
- **Example**: `myaccount-prod/mydb` (unique)

### Container Store
- **Old keyPath**: `id` (not unique across databases)
- **New keyPath**: `_key` (composite: `accountName/databaseName/containerId`)
- **Example**: `myaccount-prod/mydb/users` (unique)

### Schema Changes

**Version 1 → Version 2**:
```typescript
// Databases
keyPath: 'id'  →  keyPath: '_key'

// Containers
keyPath: 'id'  →  keyPath: '_key'
```

The upgrade function deletes and recreates these stores to apply the new schema.

### Data Transformation
When saving data, composite keys are automatically added:

```typescript
// Databases
const databasesWithKeys = data.databases.map((db) => ({
  ...db,
  _key: `${db.accountName}/${db.id}`,
}))

// Containers
const containersWithKeys = data.containers.map((cont) => ({
  ...cont,
  _key: `${cont.accountName}/${cont.databaseName}/${cont.id}`,
}))
```

## Testing
The fix ensures:
- ✅ No duplicate key errors
- ✅ Each database/container has a globally unique key
- ✅ Existing users automatically migrate to version 2
- ✅ Old data is safely replaced with new schema

## Files Changed
- `lib/db/search-index.ts` - Schema v1 → v2, composite keys

## Migration
Users with existing IndexedDB data:
1. Open the app (triggers version 2 upgrade)
2. Old `databases` and `containers` stores are deleted
3. New stores created with `_key` as keyPath
4. Rebuild search index (will populate with composite keys)

No manual intervention required!
