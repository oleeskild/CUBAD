import { NextRequest, NextResponse } from 'next/server'
import { getCosmosClient } from '@/lib/azure/cosmos'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 1 minute

/**
 * POST /api/query
 * Execute a Cosmos DB SQL query with read-only keys
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accountName, resourceGroup, databaseId, containerId, query } = body

    if (!accountName || !resourceGroup || !databaseId || !containerId || !query) {
      return NextResponse.json(
        {
          error: 'Missing parameters',
          message: 'accountName, resourceGroup, databaseId, containerId, and query are required',
        },
        { status: 400 }
      )
    }

    // Validate that query is read-only (only SELECT statements)
    const trimmedQuery = query.trim().toUpperCase()
    if (!trimmedQuery.startsWith('SELECT')) {
      return NextResponse.json(
        {
          error: 'Invalid query',
          message: 'Only SELECT queries are allowed in read-only mode',
        },
        { status: 400 }
      )
    }

    // Get Cosmos client (uses read-only keys)
    const client = await getCosmosClient(accountName, resourceGroup)
    const database = client.database(databaseId)
    const container = database.container(containerId)

    // Execute query
    const startTime = Date.now()
    const { resources, requestCharge, hasMoreResults } = await container.items
      .query(query)
      .fetchAll()
    const executionTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      results: resources,
      metadata: {
        count: resources.length,
        requestCharge: requestCharge,
        executionTime,
        hasMoreResults,
      },
    })
  } catch (error: any) {
    console.error('Error executing query:', error)

    // Extract error message from various possible locations in Cosmos DB error
    const errorMessage =
      error.body?.message ||
      error.message ||
      error.toString() ||
      'Unknown error occurred'

    // Check for specific Cosmos DB errors
    if (error.code === 400) {
      return NextResponse.json(
        {
          error: 'Query syntax error',
          message: errorMessage,
        },
        { status: 400 }
      )
    }

    if (error.code === 403) {
      return NextResponse.json(
        {
          error: 'Permission denied',
          message: 'Read-only keys cannot perform this operation',
        },
        { status: 403 }
      )
    }

    // Return error with the message we extracted
    return NextResponse.json(
      {
        error: 'Query execution failed',
        message: errorMessage,
      },
      { status: 500 }
    )
  }
}
