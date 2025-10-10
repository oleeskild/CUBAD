import Anthropic from '@anthropic-ai/sdk'
import { AIProvider, AIProviderConfig, AIQueryContext, AIAssistResponse } from '@/types/ai'
import { buildSystemPrompt, buildQueryGenerationPrompt, buildQueryExplanationPrompt } from './provider'

export class AnthropicProvider implements AIProvider {
  private client: Anthropic
  private model: string

  constructor(config: AIProviderConfig) {
    if (!config.apiKey) {
      throw new Error('Anthropic API key is required')
    }

    this.client = new Anthropic({
      apiKey: config.apiKey,
    })
    this.model = config.model || 'claude-3-5-sonnet-20241022'
  }

  async generateQuery(prompt: string, context: AIQueryContext): Promise<AIAssistResponse> {
    const systemPrompt = buildSystemPrompt(context)
    const userPrompt = buildQueryGenerationPrompt(prompt)

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic')
    }

    try {
      const result = JSON.parse(content.text)
      return {
        query: result.query,
        explanation: result.explanation,
      }
    } catch (error) {
      throw new Error('Failed to parse AI response: ' + content.text)
    }
  }

  async explainQuery(query: string, context: AIQueryContext): Promise<string> {
    const systemPrompt = buildSystemPrompt(context)
    const userPrompt = buildQueryExplanationPrompt(query)

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic')
    }

    return content.text
  }
}
