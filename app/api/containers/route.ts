import { NextRequest, NextResponse } from 'next/server'
import { listContainers } from '@/lib/azure/cosmos'

export const dynamic = 'force-dynamic'

/**
 * GET /api/containers?accountName=xxx&resourceGroup=xxx&databaseId=xxx
 * List all containers in a database
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const accountName = searchParams.get('accountName')
    const resourceGroup = searchParams.get('resourceGroup')
    const databaseId = searchParams.get('databaseId')

    if (!accountName || !resourceGroup || !databaseId) {
      return NextResponse.json(
        {
          error: 'Missing parameters',
          message: 'accountName, resourceGroup, and databaseId are required',
        },
        { status: 400 }
      )
    }

    const containers = await listContainers(accountName, resourceGroup, databaseId)

    return NextResponse.json({ containers })
  } catch (error: any) {
    console.error('Error listing containers:', error)

    return NextResponse.json(
      {
        error: 'Failed to list containers',
        message: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
