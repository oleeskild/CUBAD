import { CosmosClient, Database, Container } from '@azure/cosmos'
import { getAccountWithKeys } from './management'
import { getSubscriptionId } from './auth'

/**
 * Cache for Cosmos clients (keyed by account name)
 * Avoids creating multiple clients for the same account
 */
const clientCache = new Map<string, CosmosClient>()

/**
 * Get or create a Cosmos DB client for a specific account
 * Uses read-only keys by default
 */
export async function getCosmosClient(
  accountName: string,
  resourceGroup: string
): Promise<CosmosClient> {
  // Check cache first
  if (clientCache.has(accountName)) {
    return clientCache.get(accountName)!
  }

  const subscriptionId = getSubscriptionId()
  if (!subscriptionId) {
    throw new Error('No subscription ID configured')
  }

  // Get account with read-only keys
  const account = await getAccountWithKeys(subscriptionId, resourceGroup, accountName)

  if (!account.endpoint || !account.readonlyKey) {
    throw new Error(`Invalid account data for: ${accountName}`)
  }

  // Create client with read-only key
  const client = new CosmosClient({
    endpoint: account.endpoint,
    key: account.readonlyKey,
  })

  // Cache for future use
  clientCache.set(accountName, client)

  return client
}

/**
 * List all databases in a Cosmos DB account
 */
export async function listDatabases(
  accountName: string,
  resourceGroup: string
): Promise<Array<{ id: string; accountName: string }>> {
  const client = await getCosmosClient(accountName, resourceGroup)

  const { resources: databases } = await client.databases.readAll().fetchAll()

  return databases.map((db) => ({
    id: db.id,
    accountName,
  }))
}

/**
 * List all containers in a database
 */
export async function listContainers(
  accountName: string,
  resourceGroup: string,
  databaseId: string
): Promise<Array<{ id: string; accountName: string; databaseName: string; partitionKey?: string }>> {
  const client = await getCosmosClient(accountName, resourceGroup)
  const database = client.database(databaseId)

  const { resources: containers } = await database.containers.readAll().fetchAll()

  return containers.map((container) => ({
    id: container.id,
    accountName,
    databaseName: databaseId,
    partitionKey: container.partitionKey?.paths?.[0],
  }))
}

/**
 * Clear the client cache (useful for testing or when credentials change)
 */
export function clearClientCache() {
  clientCache.clear()
}
