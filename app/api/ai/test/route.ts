import { NextRequest, NextResponse } from 'next/server'
import { createAIProvider } from '@/lib/ai/provider'
import { AIProviderConfig } from '@/types/ai'

interface TestRequest {
  provider: AIProviderConfig
}

export async function POST(request: NextRequest) {
  try {
    const body: TestRequest = await request.json()

    const { provider } = body

    if (!provider || !provider.type) {
      return NextResponse.json({ error: 'Provider configuration is required' }, { status: 400 })
    }

    // Try to create the provider (this validates the configuration)
    const aiProvider = createAIProvider(provider)

    // Test with a simple query
    const testContext = {
      containerName: 'test',
      databaseName: 'test',
      accountName: 'test',
    }

    const result = await aiProvider.generateQuery('Get all documents', testContext)

    return NextResponse.json({
      success: true,
      message: 'Connection successful',
      testQuery: result.query,
    })
  } catch (error: any) {
    console.error('AI provider test error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Connection failed',
      },
      { status: 400 }
    )
  }
}
