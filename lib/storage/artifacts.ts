import { ArtifactDefinition } from '@/types/ai'

const DB_NAME = 'cubad-artifacts'
const DB_VERSION = 1
const STORE_NAME = 'artifacts'

let dbInstance: IDBDatabase | null = null

async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })

        // Indexes for efficient querying
        store.createIndex('containerName', 'collectionContext.containerName', { unique: false })
        store.createIndex('databaseName', 'collectionContext.databaseName', { unique: false })
        store.createIndex('accountName', 'collectionContext.accountName', { unique: false })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }
  })
}

export async function saveArtifact(artifact: ArtifactDefinition): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(artifact)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function getArtifact(id: string): Promise<ArtifactDefinition | null> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || null)
  })
}

export async function deleteArtifact(id: string): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function listArtifacts(): Promise<ArtifactDefinition[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

export async function listArtifactsForContainer(
  accountName: string,
  databaseName: string,
  containerName: string
): Promise<ArtifactDefinition[]> {
  const allArtifacts = await listArtifacts()
  return allArtifacts.filter(
    (artifact) =>
      artifact.collectionContext.accountName === accountName &&
      artifact.collectionContext.databaseName === databaseName &&
      artifact.collectionContext.containerName === containerName
  )
}

export async function listArtifactsByType(type: string): Promise<ArtifactDefinition[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('type')
    const request = index.getAll(type)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

export async function clearAllArtifacts(): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}
