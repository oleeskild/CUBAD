import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface SearchIndexDB extends DBSchema {
  accounts: {
    key: string
    value: {
      id: string
      name: string
      location: string
      resourceGroup: string
    }
  }
  databases: {
    key: string // composite: accountName/databaseId
    value: {
      id: string
      accountName: string
      accountResourceGroup: string
      _key: string // composite key for uniqueness
    }
    indexes: { 'by-account': string }
  }
  containers: {
    key: string // composite: accountName/databaseName/containerId
    value: {
      id: string
      accountName: string
      accountResourceGroup: string
      databaseName: string
      partitionKey?: string
      _key: string // composite key for uniqueness
    }
    indexes: { 'by-database': string }
  }
  metadata: {
    key: string
    value: {
      key: string
      lastUpdated: number
      totalAccounts: number
      totalDatabases: number
      totalContainers: number
    }
  }
}

let dbInstance: IDBPDatabase<SearchIndexDB> | null = null

async function getDB() {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<SearchIndexDB>('cubad-search-index', 2, {
    upgrade(db, oldVersion) {
      // Version 1 -> 2: Fix composite keys
      if (oldVersion < 2) {
        // Delete old stores if they exist
        if (db.objectStoreNames.contains('databases')) {
          db.deleteObjectStore('databases')
        }
        if (db.objectStoreNames.contains('containers')) {
          db.deleteObjectStore('containers')
        }
      }

      // Create accounts store
      if (!db.objectStoreNames.contains('accounts')) {
        db.createObjectStore('accounts', { keyPath: 'id' })
      }

      // Create databases store with composite key
      if (!db.objectStoreNames.contains('databases')) {
        const dbStore = db.createObjectStore('databases', { keyPath: '_key' })
        dbStore.createIndex('by-account', 'accountName')
      }

      // Create containers store with composite key
      if (!db.objectStoreNames.contains('containers')) {
        const containerStore = db.createObjectStore('containers', { keyPath: '_key' })
        containerStore.createIndex('by-database', ['accountName', 'databaseName'])
      }

      // Create metadata store
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' })
      }
    },
  })

  return dbInstance
}

export async function saveSearchIndex(data: {
  accounts: Array<{ id: string; name: string; location: string; resourceGroup: string }>
  databases: Array<{ id: string; accountName: string; accountResourceGroup: string }>
  containers: Array<{
    id: string
    accountName: string
    accountResourceGroup: string
    databaseName: string
    partitionKey?: string
  }>
}) {
  const db = await getDB()
  const tx = db.transaction(['accounts', 'databases', 'containers', 'metadata'], 'readwrite')

  // Clear existing data
  await Promise.all([
    tx.objectStore('accounts').clear(),
    tx.objectStore('databases').clear(),
    tx.objectStore('containers').clear(),
  ])

  // Add composite keys to databases and containers
  const databasesWithKeys = data.databases.map((db) => ({
    ...db,
    _key: `${db.accountName}/${db.id}`,
  }))

  const containersWithKeys = data.containers.map((cont) => ({
    ...cont,
    _key: `${cont.accountName}/${cont.databaseName}/${cont.id}`,
  }))

  // Save new data
  await Promise.all([
    ...data.accounts.map((acc) => tx.objectStore('accounts').add(acc)),
    ...databasesWithKeys.map((db) => tx.objectStore('databases').add(db)),
    ...containersWithKeys.map((cont) => tx.objectStore('containers').add(cont)),
  ])

  // Save metadata
  await tx.objectStore('metadata').put({
    key: 'index',
    lastUpdated: Date.now(),
    totalAccounts: data.accounts.length,
    totalDatabases: data.databases.length,
    totalContainers: data.containers.length,
  })

  await tx.done
}

export async function getSearchIndex() {
  const db = await getDB()

  const [accounts, databases, containers] = await Promise.all([
    db.getAll('accounts'),
    db.getAll('databases'),
    db.getAll('containers'),
  ])

  return { accounts, databases, containers }
}

export async function getSearchIndexMetadata() {
  const db = await getDB()
  return db.get('metadata', 'index')
}

export async function clearSearchIndex() {
  const db = await getDB()
  const tx = db.transaction(['accounts', 'databases', 'containers', 'metadata'], 'readwrite')

  await Promise.all([
    tx.objectStore('accounts').clear(),
    tx.objectStore('databases').clear(),
    tx.objectStore('containers').clear(),
    tx.objectStore('metadata').clear(),
  ])

  await tx.done
}
