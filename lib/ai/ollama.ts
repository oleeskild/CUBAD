import { AIProvider, AIProviderConfig, AIQueryContext, AIAssistResponse } from '@/types/ai'
import { buildSystemPrompt, buildQueryGenerationPrompt, buildQueryExplanationPrompt } from './provider'

export class OllamaProvider implements AIProvider {
  private endpoint: string
  private model: string

  constructor(config: AIProviderConfig) {
    this.endpoint = config.endpoint || 'http://localhost:11434'
    this.model = config.model || 'llama3'
  }

  async generateQuery(prompt: string, context: AIQueryContext): Promise<AIAssistResponse> {
    const systemPrompt = buildSystemPrompt(context)
    const userPrompt = buildQueryGenerationPrompt(prompt)

    const response = await fetch(`${this.endpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama API error: ${error}`)
    }

    const data = await response.json()
    const content = data.message?.content

    if (!content) {
      throw new Error('No response from Ollama')
    }

    try {
      const result = JSON.parse(content)
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

    const response = await fetch(`${this.endpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama API error: ${error}`)
    }

    const data = await response.json()
    return data.message?.content || 'No explanation available'
  }
}
