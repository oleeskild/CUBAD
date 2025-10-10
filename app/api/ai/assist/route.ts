import { NextRequest, NextResponse } from 'next/server'
import { createAIProvider } from '@/lib/ai/provider'
import { AIAssistRequest } from '@/types/ai'

export async function POST(request: NextRequest) {
  try {
    const body: AIAssistRequest = await request.json()

    const { prompt, context, provider } = body

    if (!prompt || !context || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt, context, or provider' },
        { status: 400 }
      )
    }

    // Validate provider configuration
    if (!provider.type) {
      return NextResponse.json({ error: 'Provider type is required' }, { status: 400 })
    }

    // Create AI provider instance
    const aiProvider = createAIProvider(provider)

    // Generate query
    const result = await aiProvider.generateQuery(prompt, context)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('AI assist error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate query' },
      { status: 500 }
    )
  }
}
