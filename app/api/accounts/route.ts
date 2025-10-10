import { NextResponse } from 'next/server'
import { listCosmosAccounts } from '@/lib/azure/management'
import { getSubscriptionId } from '@/lib/azure/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/accounts
 * List all Cosmos DB accounts in the subscription
 */
export async function GET() {
  try {
    const subscriptionId = getSubscriptionId()

    if (!subscriptionId) {
      return NextResponse.json(
        {
          error: 'No subscription ID configured',
          message: 'Please set AZURE_SUBSCRIPTION_ID environment variable or ensure you are logged in with az login'
        },
        { status: 400 }
      )
    }

    const accounts = await listCosmosAccounts(subscriptionId)

    return NextResponse.json({ accounts })
  } catch (error: any) {
    console.error('Error listing Cosmos DB accounts:', error)

    // Check if it's an authentication error
    if (error.code === 'CredentialUnavailableError' || error.message?.includes('authentication')) {
      return NextResponse.json(
        {
          error: 'Authentication failed',
          message: 'Please run "az login" to authenticate with Azure CLI',
          details: error.message,
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to list Cosmos DB accounts',
        message: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
