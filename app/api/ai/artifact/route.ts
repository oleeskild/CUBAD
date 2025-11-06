import { NextRequest, NextResponse } from 'next/server'
import { GenerateArtifactRequest, GenerateArtifactResponse, ArtifactDefinition } from '@/types/ai'
import { buildArtifactGenerationPrompt, buildArtifactRefinementPrompt } from '@/lib/ai/provider'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    const body: GenerateArtifactRequest = await request.json()
    const { prompt, context, provider, sampleData, existingArtifact, refinementPrompt } = body

    if (!context || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields: context, provider' },
        { status: 400 }
      )
    }

    // Sanitize sample data to be GDPR compliant (same as AIAssistant)
    const sanitizeValue = (value: any): any => {
      if (value === null || value === undefined) return null
      if (typeof value === 'string') return '[REDACTED]'
      if (typeof value === 'number') return 0
      if (typeof value === 'boolean') return false
      if (Array.isArray(value)) {
        return value.length > 0 ? [sanitizeValue(value[0])] : []
      }
      if (typeof value === 'object') {
        const sanitized: any = {}
        for (const key in value) {
          if (value.hasOwnProperty(key)) {
            sanitized[key] = sanitizeValue(value[key])
          }
        }
        return sanitized
      }
      return value
    }

    const sanitizedSampleData = sampleData?.map(doc => sanitizeValue(doc))

    // Log sanitized data for verification
    if (sanitizedSampleData && sanitizedSampleData.length > 0) {
      console.log('Sanitized sample data being sent to AI:', JSON.stringify(sanitizedSampleData[0], null, 2))
    }

    // Build prompt based on whether this is a new artifact or a refinement
    let artifactPrompt: string
    if (existingArtifact && refinementPrompt) {
      // Refinement mode - modify existing artifact
      artifactPrompt = buildArtifactRefinementPrompt(
        existingArtifact,
        refinementPrompt,
        sanitizedSampleData
      )
    } else {
      // Creation mode - build from scratch (always magic/ai-decided)
      artifactPrompt = buildArtifactGenerationPrompt(prompt, 'magic', sanitizedSampleData)
    }

    let responseText: string

    // Call AI provider based on type
    switch (provider.type) {
      case 'anthropic': {
        if (!provider.apiKey) {
          return NextResponse.json({ error: 'Anthropic API key required' }, { status: 400 })
        }

        const client = new Anthropic({ apiKey: provider.apiKey })
        const model = provider.model || 'claude-3-5-sonnet-20241022'

        const response = await client.messages.create({
          model,
          max_tokens: 4096,
          messages: [{ role: 'user', content: artifactPrompt }],
        })

        const content = response.content[0]
        if (content.type !== 'text') {
          throw new Error('Unexpected response type from Anthropic')
        }
        responseText = content.text
        break
      }

      case 'openrouter': {
        if (!provider.apiKey) {
          return NextResponse.json({ error: 'OpenRouter API key required' }, { status: 400 })
        }

        const model = provider.model || 'anthropic/claude-3.5-sonnet'
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://cubad.app',
            'X-Title': 'Cubad - Cosmos DB UI',
          },
          body: JSON.stringify({
            model,
            max_tokens: 4096,
            messages: [{ role: 'user', content: artifactPrompt }],
          }),
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(`OpenRouter API error: ${error}`)
        }

        const data = await response.json()
        responseText = data.choices?.[0]?.message?.content

        if (!responseText) {
          throw new Error('No response from OpenRouter')
        }
        break
      }

      case 'ollama': {
        const endpoint = provider.endpoint || 'http://localhost:11434'
        const model = provider.model || 'llama2'

        const response = await fetch(`${endpoint}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt: artifactPrompt,
            stream: false,
          }),
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(`Ollama API error: ${error}`)
        }

        const data = await response.json()
        responseText = data.response

        if (!responseText) {
          throw new Error('No response from Ollama')
        }
        break
      }

      case 'azure-openai': {
        if (!provider.apiKey || !provider.endpoint || !provider.deploymentName) {
          return NextResponse.json(
            { error: 'Azure OpenAI requires apiKey, endpoint, and deploymentName' },
            { status: 400 }
          )
        }

        const url = `${provider.endpoint}/openai/deployments/${provider.deploymentName}/chat/completions?api-version=2024-02-15-preview`

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'api-key': provider.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: artifactPrompt }],
            max_tokens: 4096,
          }),
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(`Azure OpenAI API error: ${error}`)
        }

        const data = await response.json()
        responseText = data.choices?.[0]?.message?.content

        if (!responseText) {
          throw new Error('No response from Azure OpenAI')
        }
        break
      }

      default:
        return NextResponse.json(
          { error: `Unknown provider type: ${provider.type}` },
          { status: 400 }
        )
    }

    let parsedResponse: {
      name: string
      description: string
      code: string
      query?: string
      explanation: string
    }

    try {
      parsedResponse = JSON.parse(responseText)
    } catch (parseError) {
      // Try cleaning markdown code blocks
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      try {
        parsedResponse = JSON.parse(cleanedResponse)
      } catch (secondParseError) {
        console.error('Failed to parse AI response:', responseText)
        return NextResponse.json(
          { error: 'Failed to parse AI response. The AI may not have returned valid JSON.', details: responseText },
          { status: 500 }
        )
      }
    }

    // Validate that the component code uses the correct function name
    if (parsedResponse.code &&
        !parsedResponse.code.includes('function ArtifactComponent') &&
        !parsedResponse.code.includes('const ArtifactComponent') &&
        !parsedResponse.code.includes('export default function ArtifactComponent')) {
      console.error('AI returned component with wrong function name. Code:', parsedResponse.code.substring(0, 200))
      return NextResponse.json(
        {
          error: 'The AI generated a component with an incorrect function name. Please try again.',
          details: 'Component must be named "ArtifactComponent" exactly.'
        },
        { status: 500 }
      )
    }

    const now = new Date().toISOString()
    // Always generate a new ID for each artifact to support versioning
    // This ensures each version is stored separately instead of overwriting
    const artifactId = `artifact-${Date.now()}-${Math.random().toString(36).substring(7)}`

    const artifact: ArtifactDefinition = {
      id: artifactId,
      // During refinement, keep the existing name to ensure proper versioning
      name: existingArtifact ? existingArtifact.name : parsedResponse.name,
      description: parsedResponse.description,
      collectionContext: {
        accountName: context.accountName,
        resourceGroup: context.resourceGroup,
        databaseName: context.databaseName,
        containerName: context.containerName,
      },
      code: parsedResponse.code,
      query: parsedResponse.query || undefined,
      dependencies: [],
      // Keep original creation date if refining
      createdAt: existingArtifact?.createdAt || now,
      updatedAt: now,
      // Increment version if refining, otherwise start at 1
      version: existingArtifact ? existingArtifact.version + 1 : 1,
    }

    const response: GenerateArtifactResponse = {
      artifact,
      explanation: parsedResponse.explanation,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error generating artifact:', error)
    return NextResponse.json(
      { error: 'Failed to generate artifact', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
