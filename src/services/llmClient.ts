// LLM APIクライアント実装

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'azure' | 'mock'
  apiKey?: string
  endpoint?: string
  model?: string
  maxTokens?: number
  temperature?: number
  timeoutMs?: number
}

export interface LLMResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  error?: string
}

// 環境変数から設定を読み込み
export function getLLMConfig(): LLMConfig {
  const provider = import.meta.env.VITE_LLM_PROVIDER || 'mock'
  
  switch (provider) {
    case 'openai':
      return {
        provider: 'openai',
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4-turbo-preview',
        maxTokens: parseInt(import.meta.env.VITE_LLM_MAX_TOKENS || '4000'),
        temperature: parseFloat(import.meta.env.VITE_LLM_TEMPERATURE || '0.3'),
        timeoutMs: parseInt(import.meta.env.VITE_LLM_TIMEOUT_MS || '30000')
      }
    
    case 'anthropic':
      return {
        provider: 'anthropic',
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
        model: import.meta.env.VITE_ANTHROPIC_MODEL || 'claude-3-opus-20240229',
        maxTokens: parseInt(import.meta.env.VITE_LLM_MAX_TOKENS || '4000'),
        temperature: parseFloat(import.meta.env.VITE_LLM_TEMPERATURE || '0.3'),
        timeoutMs: parseInt(import.meta.env.VITE_LLM_TIMEOUT_MS || '30000')
      }
    
    case 'azure':
      return {
        provider: 'azure',
        apiKey: import.meta.env.VITE_AZURE_OPENAI_API_KEY,
        endpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT,
        model: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT,
        maxTokens: parseInt(import.meta.env.VITE_LLM_MAX_TOKENS || '4000'),
        temperature: parseFloat(import.meta.env.VITE_LLM_TEMPERATURE || '0.3'),
        timeoutMs: parseInt(import.meta.env.VITE_LLM_TIMEOUT_MS || '30000')
      }
    
    default:
      return {
        provider: 'mock',
        maxTokens: 4000,
        temperature: 0.3,
        timeoutMs: 1000
      }
  }
}

// LLMクライアントクラス
export class LLMClient {
  private config: LLMConfig

  constructor(config?: LLMConfig) {
    this.config = config || getLLMConfig()
  }

  async sendPrompt(prompt: string): Promise<LLMResponse> {
    switch (this.config.provider) {
      case 'openai':
        return this.callOpenAI(prompt)
      case 'anthropic':
        return this.callAnthropic(prompt)
      case 'azure':
        return this.callAzureOpenAI(prompt)
      default:
        return this.mockResponse(prompt)
    }
  }

  private async callOpenAI(prompt: string): Promise<LLMResponse> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI APIキーが設定されていません')
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs || 30000)

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: this.config.maxTokens || 4000,
          temperature: this.config.temperature || 0.3,
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
      }

      const data = await response.json()
      
      return {
        content: data.choices[0].message.content,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { content: '', error: 'リクエストがタイムアウトしました' }
        }
        return { content: '', error: error.message }
      }
      return { content: '', error: '不明なエラーが発生しました' }
    }
  }

  private async callAnthropic(prompt: string): Promise<LLMResponse> {
    if (!this.config.apiKey) {
      throw new Error('Anthropic APIキーが設定されていません')
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs || 30000)

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model || 'claude-3-opus-20240229',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: this.config.maxTokens || 4000,
          temperature: this.config.temperature || 0.3
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`)
      }

      const data = await response.json()
      
      return {
        content: data.content[0].text,
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { content: '', error: 'リクエストがタイムアウトしました' }
        }
        return { content: '', error: error.message }
      }
      return { content: '', error: '不明なエラーが発生しました' }
    }
  }

  private async callAzureOpenAI(prompt: string): Promise<LLMResponse> {
    if (!this.config.apiKey || !this.config.endpoint || !this.config.model) {
      throw new Error('Azure OpenAI設定が不完全です')
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs || 30000)

      const url = `${this.config.endpoint}/openai/deployments/${this.config.model}/chat/completions?api-version=2024-02-01`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'api-key': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: this.config.maxTokens || 4000,
          temperature: this.config.temperature || 0.3,
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Azure OpenAI API error: ${error.error?.message || response.statusText}`)
      }

      const data = await response.json()
      
      return {
        content: data.choices[0].message.content,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { content: '', error: 'リクエストがタイムアウトしました' }
        }
        return { content: '', error: error.message }
      }
      return { content: '', error: '不明なエラーが発生しました' }
    }
  }

  private async mockResponse(prompt: string): Promise<LLMResponse> {
    // 模擬的な遅延を追加
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // プロンプトに応じた模擬レスポンスを生成
    if (prompt.includes('標準JSON形式に変換')) {
      return {
        content: JSON.stringify({
          transactions: [
            {
              date: '2024-01-15',
              description: '管理費収入 101号室',
              amount: 25000,
              confidence: 95
            },
            {
              date: '2024-01-20',
              description: '清掃業務委託料',
              amount: -50000,
              confidence: 90
            }
          ],
          metadata: {
            bankName: '模擬銀行',
            importedAt: new Date().toISOString(),
            originalFormat: 'CSV'
          }
        }),
        usage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150
        }
      }
    }
    
    if (prompt.includes('仕訳を生成')) {
      return {
        content: JSON.stringify({
          suggestions: [{
            confidence: 85,
            journal: {
              date: '2024-01-15',
              description: '管理費収入',
              entries: [{
                debit: {
                  account: '1112',
                  accountName: '普通預金',
                  amount: 25000
                },
                credit: {
                  account: '4111',
                  accountName: '管理費収入',
                  amount: 25000
                }
              }]
            },
            reasoning: '模擬的な判断理由'
          }]
        }),
        usage: {
          promptTokens: 150,
          completionTokens: 80,
          totalTokens: 230
        }
      }
    }
    
    return {
      content: '{"message": "模擬レスポンス"}',
      usage: {
        promptTokens: 50,
        completionTokens: 20,
        totalTokens: 70
      }
    }
  }

  // 設定の確認
  isConfigured(): boolean {
    if (this.config.provider === 'mock') {
      return true
    }
    return !!this.config.apiKey
  }

  // 現在のプロバイダーを取得
  getProvider(): string {
    return this.config.provider
  }

  // トークン使用量の推定（文字数ベース）
  estimateTokens(text: string): number {
    // 簡易的な推定: 日本語は約2文字で1トークン、英語は約4文字で1トークン
    const japaneseChars = (text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length
    const englishChars = text.length - japaneseChars
    return Math.ceil(japaneseChars / 2 + englishChars / 4)
  }
}