import { NextRequest, NextResponse } from 'next/server'
import { listDatabases } from '@/lib/azure/cosmos'

export const dynamic = 'force-dynamic'

/**
 * GET /api/databases?accountName=xxx&resourceGroup=xxx
 * List all databases in a Cosmos DB account
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const accountName = searchParams.get('accountName')
    const resourceGroup = searchParams.get('resourceGroup')

    if (!accountName || !resourceGroup) {
      return NextResponse.json(
        {
          error: 'Missing parameters',
          message: 'Both accountName and resourceGroup are required',
        },
        { status: 400 }
      )
    }

    const databases = await listDatabases(accountName, resourceGroup)

    return NextResponse.json({ databases })
  } catch (error: any) {
    console.error('Error listing databases:', error)

    return NextResponse.json(
      {
        error: 'Failed to list databases',
        message: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
