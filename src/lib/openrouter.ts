/**
 * OpenRouter SDK — Secure backend-only AI service with key rotation,
 * retry logic, rate-limit handling, and agentic tool-use support.
 */

// ===== KEY ROTATION =====
const API_KEYS = [
  process.env.OPENROUTER_API_KEY_1,
  process.env.OPENROUTER_API_KEY_2,
].filter(Boolean) as string[]

let currentKeyIndex = 0
const keyErrorCount = new Map<number, number>()
const KEY_ERROR_THRESHOLD = 3

function getAPIKey(): string {
  if (API_KEYS.length === 0) {
    throw new Error('No OpenRouter API keys configured')
  }

  // Try current key first
  const errors = keyErrorCount.get(currentKeyIndex) || 0
  if (errors < KEY_ERROR_THRESHOLD) {
    return API_KEYS[currentKeyIndex]
  }

  // Rotate to next healthy key
  for (let i = 0; i < API_KEYS.length; i++) {
    const idx = (currentKeyIndex + i + 1) % API_KEYS.length
    const errCount = keyErrorCount.get(idx) || 0
    if (errCount < KEY_ERROR_THRESHOLD) {
      currentKeyIndex = idx
      return API_KEYS[idx]
    }
  }

  // All keys exhausted — reset and try first
  keyErrorCount.clear()
  currentKeyIndex = 0
  return API_KEYS[0]
}

function markKeyError(index: number) {
  keyErrorCount.set(index, (keyErrorCount.get(index) || 0) + 1)
}

function markKeySuccess(index: number) {
  keyErrorCount.delete(index)
}

// ===== TYPES =====
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
  tool_calls?: ToolCall[]
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, {
        type: string
        description: string
        enum?: string[]
      }>
      required: string[]
    }
  }
}

export interface CompletionResult {
  content: string | null
  tool_calls: ToolCall[]
  finish_reason: string
  model: string
  usage: { prompt_tokens: number; completion_tokens: number } | null
}

// ===== COMPLETION =====
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

async function makeCompletionRequest(
  messages: ChatMessage[],
  tools?: ToolDefinition[],
  model?: string,
  apiKey?: string,
): Promise<Response> {
  const key = apiKey || getAPIKey()
  const useModel = model || process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001'

  const body: Record<string, unknown> = {
    model: useModel,
    messages,
    temperature: 0.7,
    max_tokens: 800,
  }

  if (tools && tools.length > 0) {
    body.tools = tools
    body.tool_choice = 'auto'
  }

  return fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://serenity-wellness.app',
      'X-Title': 'Serenity Wellness Companion',
    },
    body: JSON.stringify(body),
  })
}

export async function createCompletion(
  messages: ChatMessage[],
  tools?: ToolDefinition[],
  retries = 2,
): Promise<CompletionResult> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    const keyIndex = currentKeyIndex

    try {
      const response = await makeCompletionRequest(messages, tools)

      // Rate limited
      if (response.status === 429) {
        markKeyError(keyIndex)
        const retryAfter = parseInt(response.headers.get('retry-after') || '5') * 1000
        console.warn(`[OpenRouter] Rate limited on key ${keyIndex}, retrying in ${retryAfter}ms`)
        await new Promise(r => setTimeout(r, Math.min(retryAfter, 10000)))
        continue
      }

      // Auth/credit error — rotate key
      if (response.status === 401 || response.status === 403 || response.status === 402) {
        markKeyError(keyIndex)
        console.warn(`[OpenRouter] Auth/credit error ${response.status} on key ${keyIndex}, rotating`)
        continue
      }

      // Server error — retry with backoff
      if (response.status >= 500) {
        console.warn(`[OpenRouter] Server error ${response.status}, attempt ${attempt}`)
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
        continue
      }

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`OpenRouter API error: ${response.status} - ${errorBody}`)
      }

      const data = await response.json()
      markKeySuccess(keyIndex)

      const choice = data.choices?.[0]
      if (!choice) {
        throw new Error('No choices in response')
      }

      return {
        content: choice.message?.content || null,
        tool_calls: choice.message?.tool_calls || [],
        finish_reason: choice.finish_reason || 'stop',
        model: data.model || useModel,
        usage: data.usage ? {
          prompt_tokens: data.usage.prompt_tokens || 0,
          completion_tokens: data.usage.completion_tokens || 0,
        } : null,
      }
    } catch (error) {
      lastError = error as Error
      console.error(`[OpenRouter] Attempt ${attempt} failed:`, lastError.message)

      // Try fallback model on last attempt
      if (attempt === retries - 1) {
        try {
          const fallbackModel = process.env.OPENROUTER_FALLBACK_MODEL
          if (fallbackModel) {
            console.log(`[OpenRouter] Trying fallback model: ${fallbackModel}`)
            const fbResponse = await makeCompletionRequest(messages, tools, fallbackModel)
            if (fbResponse.ok) {
              const fbData = await fbResponse.json()
              const fbChoice = fbData.choices?.[0]
              if (fbChoice) {
                return {
                  content: fbChoice.message?.content || null,
                  tool_calls: fbChoice.message?.tool_calls || [],
                  finish_reason: fbChoice.finish_reason || 'stop',
                  model: fbData.model || fallbackModel,
                  usage: fbData.usage ? {
                    prompt_tokens: fbData.usage.prompt_tokens || 0,
                    completion_tokens: fbData.usage.completion_tokens || 0,
                  } : null,
                }
              }
            }
          }
        } catch (fbError) {
          console.error('[OpenRouter] Fallback model also failed:', fbError)
        }
      }

      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
  }

  throw lastError || new Error('All completion attempts failed')
}

// ===== SIMPLE CHAT (no tools) =====
export async function simpleChat(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
): Promise<string> {
  const allMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ]

  const result = await createCompletion(allMessages)
  return result.content || 'I\'m having trouble finding the right words. Please try again.'
}

const useModel = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001'
export { useModel as defaultModel }
