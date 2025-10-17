import { NextRequest, NextResponse } from 'next/server'
import { getCosmosClient } from '@/lib/azure/cosmos'

export const dynamic = 'force-dynamic'

/**
 * GET /api/sample-document
 * Fetch a sample document from a container to get schema/property keys
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountName = searchParams.get('accountName')
    const resourceGroup = searchParams.get('resourceGroup')
    const databaseId = searchParams.get('databaseId')
    const containerId = searchParams.get('containerId')

    if (!accountName || !resourceGroup || !databaseId || !containerId) {
      return NextResponse.json(
        {
          error: 'Missing parameters',
          message: 'accountName, resourceGroup, databaseId, and containerId are required',
        },
        { status: 400 }
      )
    }

    // Get Cosmos client (uses read-only keys)
    const client = await getCosmosClient(accountName, resourceGroup)
    const database = client.database(databaseId)
    const container = database.container(containerId)

    // Fetch the most recent document ordered by _ts (timestamp)
    const query = 'SELECT TOP 1 * FROM c ORDER BY c._ts DESC'
    const { resources } = await container.items.query(query).fetchAll()

    if (resources.length === 0) {
      return NextResponse.json({
        success: true,
        properties: [],
      })
    }

    // Extract all property keys from the document
    const extractKeys = (obj: any, prefix = ''): string[] => {
      const keys: string[] = []

      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const fullKey = prefix ? `${prefix}.${key}` : key
          keys.push(fullKey)

          // Recursively extract nested properties (up to 2 levels deep)
          if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && prefix.split('.').length < 2) {
            keys.push(...extractKeys(obj[key], fullKey))
          }
        }
      }

      return keys
    }

    const properties = extractKeys(resources[0])

    return NextResponse.json({
      success: true,
      properties,
    })
  } catch (error: any) {
    console.error('Error fetching sample document:', error)

    const errorMessage =
      error.body?.message ||
      error.message ||
      error.toString() ||
      'Unknown error occurred'

    return NextResponse.json(
      {
        error: 'Failed to fetch sample document',
        message: errorMessage,
      },
      { status: 500 }
    )
  }
}
