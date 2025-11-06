import { ArtifactDefinition } from '@/types/ai'

const DB_NAME = 'cubad-container-artifacts'
const DB_VERSION = 2
const STORE_NAME = 'container-artifacts'

export interface ContainerArtifactKey {
  accountName: string
  resourceGroup?: string
  databaseName: string
  containerName: string
}

interface ContainerArtifact {
  id: string
  key: ContainerArtifactKey
  containerKeyString: string // Added for efficient indexing
  artifact: ArtifactDefinition
  createdAt: string
  updatedAt: string
}

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
      const version = event.oldVersion

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })

        // Index for container-based queries
        store.createIndex('containerKeyString', 'containerKeyString', { unique: false })
      } else if (version < 2) {
        // Version 1 to 2: Add containerKeyString index and migrate existing data
        const store = (event.target as IDBOpenDBRequest).transaction!.objectStore(STORE_NAME)

        // Create the new index
        if (!store.indexNames.contains('containerKeyString')) {
          store.createIndex('containerKeyString', 'containerKeyString', { unique: false })
        }

        // Migrate existing data to add containerKeyString
        const cursorRequest = store.openCursor()
        cursorRequest.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest).result
          if (cursor) {
            const data = cursor.value as any
            if (data.key && !data.containerKeyString) {
              const containerKeyString = `${data.key.accountName}/${data.key.resourceGroup || 'no-rg'}/${data.key.databaseName}/${data.key.containerName}`
              const updatedData = { ...data, containerKeyString }
              cursor.update(updatedData)
            }
            cursor.continue()
          }
        }
      }
    }
  })
}

export async function saveContainerArtifact(
  key: ContainerArtifactKey,
  artifact: ArtifactDefinition
): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const containerKeyString = `${key.accountName}/${key.resourceGroup || 'no-rg'}/${key.databaseName}/${key.containerName}`

    // Check if this is a new version of an existing artifact
    const index = store.index('containerKeyString')
    const checkRequest = index.getAll(containerKeyString)

    checkRequest.onerror = () => reject(checkRequest.error)
    checkRequest.onsuccess = () => {
      const existingArtifacts = checkRequest.result || []
      const sameNameArtifacts = existingArtifacts.filter((item: any) =>
        item.artifact.name === artifact.name
      )

      // If artifact with same name exists and it's a different ID, increment version
      let finalArtifact = { ...artifact }
      let finalId = artifact.id

      if (sameNameArtifacts.length > 0) {
        const existingArtifact = sameNameArtifacts.find((item: any) => item.artifact.id === artifact.id)

        // If this is a new artifact (not an update) with the same name, increment version
        if (!existingArtifact) {
          const maxVersion = Math.max(...sameNameArtifacts.map((item: any) => item.artifact.version || 1))
          const newVersion = maxVersion + 1

          // Generate a new unique ID for this version
          const timestamp = Date.now()
          const random = Math.random().toString(36).substring(2, 8)
          finalId = `${artifact.name}-v${newVersion}-${timestamp}-${random}`

          finalArtifact = {
            ...artifact,
            id: finalId,
            version: newVersion,
            updatedAt: new Date().toISOString()
          }
        }
      }

      const request = store.put({
        id: finalId,
        key,
        containerKeyString, // Add indexed string key
        artifact: finalArtifact,
        createdAt: finalArtifact.createdAt,
        updatedAt: new Date().toISOString()
      })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    }
  })
}

export async function getContainerArtifact(id: string): Promise<ArtifactDefinition | null> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    const request = store.get(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const result = request.result
      resolve(result?.artifact || null)
    }
  })
}

export async function deleteContainerArtifact(id: string): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}


export async function getArtifactsForContainer(
  accountName: string,
  databaseName: string,
  containerName: string,
  resourceGroup?: string
): Promise<Array<{
  id: string
  artifact: ArtifactDefinition
  createdAt: string
  updatedAt: string
}>> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('containerKeyString')

    const containerKeyString = `${accountName}/${resourceGroup || 'no-rg'}/${databaseName}/${containerName}`
    const request = index.getAll(containerKeyString)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const results = request.result || []
      // Transform the results to match expected output format
      const artifacts = results.map((result: any) => ({
        id: result.id,
        artifact: result.artifact,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      }))
      resolve(artifacts)
    }
  })
}

// New function to get all versions of a specific artifact name
export async function getArtifactVersions(
  accountName: string,
  databaseName: string,
  containerName: string,
  artifactName: string,
  resourceGroup?: string
): Promise<Array<{
  id: string
  artifact: ArtifactDefinition
  createdAt: string
  updatedAt: string
}>> {
  const allArtifacts = await getArtifactsForContainer(
    accountName,
    databaseName,
    containerName,
    resourceGroup
  )

  // Filter by artifact name and sort by version (descending)
  return allArtifacts
    .filter(item => item.artifact.name === artifactName)
    .sort((a, b) => b.artifact.version - a.artifact.version)
}

// New function to get the latest version of an artifact by name
export async function getLatestArtifactVersion(
  accountName: string,
  databaseName: string,
  containerName: string,
  artifactName: string,
  resourceGroup?: string
): Promise<ArtifactDefinition | null> {
  const versions = await getArtifactVersions(
    accountName,
    databaseName,
    containerName,
    artifactName,
    resourceGroup
  )

  return versions.length > 0 ? versions[0].artifact : null
}

// New function to rename an artifact type (updates all versions)
export async function renameArtifactType(
  accountName: string,
  databaseName: string,
  containerName: string,
  oldName: string,
  newName: string,
  resourceGroup?: string
): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('containerKeyString')

    const containerKeyString = `${accountName}/${resourceGroup || 'no-rg'}/${databaseName}/${containerName}`
    const request = index.getAll(containerKeyString)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const results = request.result || []
      const artifactsToUpdate = results.filter((item: any) => item.artifact.name === oldName)

      if (artifactsToUpdate.length === 0) {
        resolve()
        return
      }

      let updateCount = 0
      const totalUpdates = artifactsToUpdate.length

      artifactsToUpdate.forEach((item: any) => {
        // Update the artifact name
        const updatedArtifact = {
          ...item,
          artifact: {
            ...item.artifact,
            name: newName
          }
        }

        const updateRequest = store.put(updatedArtifact)
        updateRequest.onerror = () => reject(updateRequest.error)
        updateRequest.onsuccess = () => {
          updateCount++
          if (updateCount === totalUpdates) {
            resolve()
          }
        }
      })
    }
  })
}

// New function to group artifacts by base name for UI display
export async function getArtifactsGroupedByName(
  accountName: string,
  databaseName: string,
  containerName: string,
  resourceGroup?: string
): Promise<Array<{
  name: string
  latestVersion: ArtifactDefinition
  versions: Array<{
    id: string
    artifact: ArtifactDefinition
    createdAt: string
    updatedAt: string
  }>
}>> {
  const allArtifacts = await getArtifactsForContainer(
    accountName,
    databaseName,
    containerName,
    resourceGroup
  )

  // Group by artifact name
  const grouped = allArtifacts.reduce((acc, item) => {
    const name = item.artifact.name
    if (!acc[name]) {
      acc[name] = []
    }
    acc[name].push(item)
    return acc
  }, {} as Record<string, typeof allArtifacts>)

  // Transform to expected format and sort versions within each group
  return Object.entries(grouped).map(([name, versions]) => {
    const sortedVersions = versions.sort((a, b) => b.artifact.version - a.artifact.version)
    return {
      name,
      latestVersion: sortedVersions[0].artifact,
      versions: sortedVersions
    }
  }).sort((a, b) => a.name.localeCompare(b.name))
}



