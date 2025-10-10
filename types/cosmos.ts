export interface CosmosAccount {
  id: string
  name: string
  location: string
  resourceGroup: string
  endpoint: string
  documentEndpoint?: string
  readonlyKey?: string
}

export interface CosmosDatabase {
  id: string
  accountName: string
}

export interface CosmosContainer {
  id: string
  accountName: string
  databaseName: string
  partitionKey?: string
}

export interface QueryResult {
  items: any[]
  requestCharge: number
  continuationToken?: string
}
