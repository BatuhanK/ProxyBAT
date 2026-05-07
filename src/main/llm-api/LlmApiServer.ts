/**
 * LLM API Server
 *
 * A minimal HTTP server (127.0.0.1 only) that exposes the configured LLM to
 * Python intercept scripts running inside mitmproxy.
 *
 * Endpoints:
 *   POST /v1/complete            — plain text completion
 *   POST /v1/complete/structured — structured JSON output (JSON Schema)
 *
 * Port: 47821 (fixed, localhost only — no auth needed)
 *
 * Python helper functions are injected into script scope via proxy_addon.py.
 */

import { createServer, IncomingMessage, ServerResponse, Server } from 'http'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createGitHubCopilotOpenAICompatible } from '@opeoginni/github-copilot-openai-compatible'
import { createZhipu } from 'zhipu-ai-provider'
import { codexCli } from 'ai-sdk-provider-codex-cli'
import { generateText, generateObject } from 'ai'
import { jsonSchema } from 'ai'
import { SettingsStore } from '../storage/SettingsStore'

const LLM_API_PORT = 47821
const LLM_API_HOST = '127.0.0.1'

/**
 * Build a model instance using the currently configured AI provider settings.
 * Accepts an optional model override (from the request body).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getModel(modelOverride?: string): any {
  const s = SettingsStore.getInstance().getAiProviderSettings()
  const model = modelOverride ?? s.activeModel

  switch (s.activeProvider) {
    case 'kimi': {
      const kimi = createAnthropic({
        baseURL: 'https://api.kimi.com/coding/v1',
        apiKey: s.kimiApiKey,
        headers: {
          'anthropic-version': '2023-06-01',
          'user-agent': 'opencode/1.2.10 ai-sdk/provider-utils/3.0.21 runtime/bun/1.3.9',
        },
      })
      return kimi(model || 'k2p5')
    }

    case 'copilot': {
      const copilot = createGitHubCopilotOpenAICompatible({
        apiKey: s.copilotApiKey,
        headers: {
          'user-agent':
            'opencode/1.2.10 ai-sdk/provider-utils/3.0.21 runtime/bun/1.3.9, opencode/1.2.10',
        },
      })
      return copilot.chatModel(model || 'claude-sonnet-4.5')
    }

    case 'zai': {
      const zai = createZhipu({
        baseURL: 'https://api.z.ai/api/coding/paas/v4',
        apiKey: s.zaiApiKey,
      })
      return zai(model || 'glm-5')
    }

    case 'codex': {
      const codexPath = s.codexPath || undefined
      return codexCli(model || 'gpt-5.2-codex', { codexPath })
    }

    case 'deepseek': {
      const deepseek = createDeepSeek({
        apiKey: s.deepseekApiKey,
      })
      return deepseek(model || 'deepseek-v4-flash')
    }

    default: {
      // Fallback: Kimi
      const kimi = createAnthropic({
        baseURL: 'https://api.kimi.com/coding/v1',
        apiKey: s.kimiApiKey,
        headers: {
          'anthropic-version': '2023-06-01',
          'user-agent': 'opencode/1.2.10 ai-sdk/provider-utils/3.0.21 runtime/bun/1.3.9',
        },
      })
      return kimi('k2p5')
    }
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown, origin?: string): void {
  const json = JSON.stringify(body)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Content-Length': String(Buffer.byteLength(json)),
  }
  // CORS: allow any origin so that JS injected into intercepted pages can call the LLM API
  headers['Access-Control-Allow-Origin'] = origin ?? '*'
  headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
  headers['Access-Control-Allow-Headers'] = 'Content-Type'
  headers['Vary'] = 'Origin'
  res.writeHead(status, headers)
  res.end(json)
}

async function handleComplete(req: IncomingMessage, res: ServerResponse, origin?: string): Promise<void> {
  let raw: string
  try {
    raw = await readBody(req)
  } catch {
    sendJson(res, 400, { error: 'Failed to read request body' }, origin)
    return
  }

  let params: { prompt?: string; system?: string; model?: string }
  try {
    params = JSON.parse(raw)
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' }, origin)
    return
  }

  if (!params.prompt || typeof params.prompt !== 'string') {
    sendJson(res, 400, { error: 'Missing required field: prompt (string)' }, origin)
    return
  }

  try {
    const result = await generateText({
      model: getModel(params.model),
      ...(params.system ? { system: params.system } : {}),
      prompt: params.prompt,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const usage = result.usage as any
    sendJson(res, 200, {
      text: result.text,
      usage: {
        prompt_tokens: usage?.promptTokens ?? usage?.inputTokens ?? 0,
        completion_tokens: usage?.completionTokens ?? usage?.outputTokens ?? 0,
        total_tokens: usage?.totalTokens ?? 0,
      },
    }, origin)
  } catch (err) {
    console.error('[LlmApiServer] /v1/complete error:', err)
    sendJson(res, 500, { error: String(err) }, origin)
  }
}

async function handleStructured(req: IncomingMessage, res: ServerResponse, origin?: string): Promise<void> {
  let raw: string
  try {
    raw = await readBody(req)
  } catch {
    sendJson(res, 400, { error: 'Failed to read request body' }, origin)
    return
  }

  let params: { prompt?: string; schema?: object; system?: string; model?: string }
  try {
    params = JSON.parse(raw)
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' }, origin)
    return
  }

  if (!params.prompt || typeof params.prompt !== 'string') {
    sendJson(res, 400, { error: 'Missing required field: prompt (string)' }, origin)
    return
  }
  if (!params.schema || typeof params.schema !== 'object') {
    sendJson(res, 400, { error: 'Missing required field: schema (JSON Schema object)' }, origin)
    return
  }

  try {
    const result = await generateObject({
      model: getModel(params.model),
      ...(params.system ? { system: params.system } : {}),
      prompt: params.prompt,
      schema: jsonSchema(params.schema as Parameters<typeof jsonSchema>[0]),
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const usage = result.usage as any
    sendJson(res, 200, {
      result: result.object,
      usage: {
        prompt_tokens: usage?.promptTokens ?? usage?.inputTokens ?? 0,
        completion_tokens: usage?.completionTokens ?? usage?.outputTokens ?? 0,
        total_tokens: usage?.totalTokens ?? 0,
      },
    }, origin)
  } catch (err) {
    console.error('[LlmApiServer] /v1/complete/structured error:', err)
    sendJson(res, 500, { error: String(err) }, origin)
  }
}

export class LlmApiServer {
  private static instance: LlmApiServer
  private server: Server | null = null

  static getInstance(): LlmApiServer {
    if (!LlmApiServer.instance) {
      LlmApiServer.instance = new LlmApiServer()
    }
    return LlmApiServer.instance
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        resolve()
        return
      }

      this.server = createServer(async (req, res) => {
        const url = req.url ?? ''
        const method = req.method ?? ''
        // Reflect origin back so browser-injected scripts on any page can call us
        const origin = req.headers['origin'] as string | undefined

        // Handle CORS preflight from browser pages
        if (method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': origin ?? '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
            'Vary': 'Origin',
          })
          res.end()
          return
        }

        if (method === 'POST' && url === '/v1/complete') {
          await handleComplete(req, res, origin)
        } else if (method === 'POST' && url === '/v1/complete/structured') {
          await handleStructured(req, res, origin)
        } else if (method === 'GET' && url === '/v1/health') {
          sendJson(res, 200, { status: 'ok', port: LLM_API_PORT }, origin)
        } else {
          sendJson(res, 404, { error: `Unknown endpoint: ${method} ${url}` }, origin)
        }
      })

      this.server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`[LlmApiServer] Port ${LLM_API_PORT} already in use — skipping start`)
          resolve() // non-fatal: another instance may be running
        } else {
          console.error('[LlmApiServer] Server error:', err)
          reject(err)
        }
      })

      this.server.listen(LLM_API_PORT, LLM_API_HOST, () => {
        console.log(`[LlmApiServer] Listening on http://${LLM_API_HOST}:${LLM_API_PORT}`)
        resolve()
      })
    })
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve()
        return
      }
      this.server.close(() => {
        this.server = null
        resolve()
      })
    })
  }

  getPort(): number {
    return LLM_API_PORT
  }
}
