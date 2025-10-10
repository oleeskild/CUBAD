import { NextRequest, NextResponse } from 'next/server'
import { createAIProvider } from '@/lib/ai/provider'
import { AIProviderConfig, AIQueryContext } from '@/types/ai'

interface ExplainRequest {
  query: string
  context: AIQueryContext
  provider: AIProviderConfig
}

export async function POST(request: NextRequest) {
  try {
    const body: ExplainRequest = await request.json()

    const { query, context, provider } = body

    if (!query || !context || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields: query, context, or provider' },
        { status: 400 }
      )
    }

    // Create AI provider instance
    const aiProvider = createAIProvider(provider)

    // Explain query
    const explanation = await aiProvider.explainQuery(query, context)

    return NextResponse.json({ explanation })
  } catch (error: any) {
    console.error('AI explain error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to explain query' },
      { status: 500 }
    )
  }
}
