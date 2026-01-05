import { AzureOpenAI } from 'openai'
import { AIProvider, AIProviderConfig, AIQueryContext, AIAssistResponse } from '@/types/ai'
import { buildSystemPrompt, buildQueryGenerationPrompt, buildQueryExplanationPrompt, extractJSON } from './provider'

export class AzureOpenAIProvider implements AIProvider {
  private client: AzureOpenAI
  private deploymentName: string

  constructor(config: AIProviderConfig) {
    if (!config.apiKey || !config.endpoint) {
      throw new Error('Azure OpenAI API key and endpoint are required')
    }

    this.client = new AzureOpenAI({
      endpoint: config.endpoint,
      apiKey: config.apiKey,
      apiVersion: '2024-10-21',
    })
    this.deploymentName = config.deploymentName || config.model || 'gpt-4'
  }

  async generateQuery(prompt: string, context: AIQueryContext): Promise<AIAssistResponse> {
    const systemPrompt = buildSystemPrompt(context)
    const userPrompt = buildQueryGenerationPrompt(prompt)

    const response = await this.client.chat.completions.create({
      model: this.deploymentName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1024,
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response from Azure OpenAI')
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

    const response = await this.client.chat.completions.create({
      model: this.deploymentName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1024,
    })

    return response.choices[0]?.message?.content || 'No explanation available'
  }
}
