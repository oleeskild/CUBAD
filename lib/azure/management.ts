import { CosmosDBManagementClient } from '@azure/arm-cosmosdb'
import { getAzureCredential } from './auth'
import { CosmosAccount } from '@/types/cosmos'

/**
 * List all Cosmos DB accounts in the subscription
 */
export async function listCosmosAccounts(subscriptionId: string): Promise<CosmosAccount[]> {
  const credential = getAzureCredential()
  const client = new CosmosDBManagementClient(credential, subscriptionId)

  const accounts: CosmosAccount[] = []

  // List all database accounts
  for await (const account of client.databaseAccounts.list()) {
    if (!account.name || !account.location || !account.id) {
      continue
    }

    // Extract resource group from account ID
    // Format: /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.DocumentDB/databaseAccounts/{name}
    const resourceGroupMatch = account.id.match(/resourceGroups\/([^/]+)/)
    const resourceGroup = resourceGroupMatch ? resourceGroupMatch[1] : 'unknown'

    accounts.push({
      id: account.id,
      name: account.name,
      location: account.location,
      resourceGroup,
      endpoint: account.documentEndpoint || '',
      documentEndpoint: account.documentEndpoint,
    })
  }

  return accounts
}

/**
 * Get read-only keys for a Cosmos DB account
 * These keys are safe to use for query operations
 */
export async function getReadOnlyKeys(
  subscriptionId: string,
  resourceGroup: string,
  accountName: string
): Promise<{ primaryReadonlyKey: string; secondaryReadonlyKey: string }> {
  const credential = getAzureCredential()
  const client = new CosmosDBManagementClient(credential, subscriptionId)

  const keys = await client.databaseAccounts.listReadOnlyKeys(resourceGroup, accountName)

  if (!keys.primaryReadonlyMasterKey || !keys.secondaryReadonlyMasterKey) {
    throw new Error(`Failed to get read-only keys for account: ${accountName}`)
  }

  return {
    primaryReadonlyKey: keys.primaryReadonlyMasterKey,
    secondaryReadonlyKey: keys.secondaryReadonlyMasterKey,
  }
}

/**
 * Get account details including keys
 */
export async function getAccountWithKeys(
  subscriptionId: string,
  resourceGroup: string,
  accountName: string
): Promise<CosmosAccount> {
  const credential = getAzureCredential()
  const client = new CosmosDBManagementClient(credential, subscriptionId)

  const account = await client.databaseAccounts.get(resourceGroup, accountName)
  const keys = await getReadOnlyKeys(subscriptionId, resourceGroup, accountName)

  if (!account.name || !account.location || !account.id) {
    throw new Error(`Invalid account data for: ${accountName}`)
  }

  return {
    id: account.id,
    name: account.name,
    location: account.location,
    resourceGroup,
    endpoint: account.documentEndpoint || '',
    documentEndpoint: account.documentEndpoint,
    readonlyKey: keys.primaryReadonlyKey,
  }
}
