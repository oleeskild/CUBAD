import { AIProvider, AIProviderConfig, AIQueryContext, AIAssistResponse } from '@/types/ai'
import { buildSystemPrompt, buildQueryGenerationPrompt, buildQueryExplanationPrompt, extractJSON } from './provider'

export class OpenRouterProvider implements AIProvider {
  private apiKey: string
  private model: string
  private endpoint: string

  constructor(config: AIProviderConfig) {
    if (!config.apiKey) {
      throw new Error('OpenRouter API key is required')
    }

    this.apiKey = config.apiKey
    this.model = config.model || 'anthropic/claude-3.5-sonnet'
    this.endpoint = 'https://openrouter.ai/api/v1/chat/completions'
  }

  async generateQuery(prompt: string, context: AIQueryContext): Promise<AIAssistResponse> {
    const systemPrompt = buildSystemPrompt(context)
    const userPrompt = buildQueryGenerationPrompt(prompt)

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://cubad.app',
        'X-Title': 'Cubad - Cosmos DB UI',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenRouter API error: ${error}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No response from OpenRouter')
    }

    try {
      const result = JSON.parse(extractJSON(content))
      return {
        query: result.query,
        explanation: result.explanation,
      }
    } catch (error) {
      throw new Error('Failed to parse AI response: ' + content)
    }
  }

  async explainQuery(query: string, context: AIQueryContext): Promise<string> {
    const systemPrompt = buildSystemPrompt(context)
    const userPrompt = buildQueryExplanationPrompt(query)

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://cubad.app',
        'X-Title': 'Cubad - Cosmos DB UI',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenRouter API error: ${error}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'No explanation available'
  }
}
