import { z } from 'zod'
import { RequestStore } from '../../../storage/RequestStore'
import { BodyStore } from '../../../storage/BodyStore'
import { fetchViaProxy } from './helpers'
import { defineTool } from '../toolFactory'

/**
 * HTTP Replay Tool
 * Replays a captured HTTP request through the proxy with optional modifications.
 * Use this to test how the server responds to parameter changes, header swaps, or method changes.
 * All test traffic is routed through the MITM proxy so it appears in the Traffic tab.
 */

type Params = z.infer<typeof paramsSchema>

const paramsSchema = z.object({
  request_id: z.string().describe('ID of the original captured request to replay'),
  override_method: z
    .string()
    .optional()
    .describe('Override HTTP method (e.g. "GET", "POST")'),
  override_headers: z
    .record(z.string())
    .optional()
    .describe('Headers to add or replace (merged with original headers)'),
  override_body: z
    .string()
    .optional()
    .describe('Replace the request body with this string'),
  override_url: z
    .string()
    .optional()
    .describe('Override the full URL (e.g. to test path traversal or IDOR)'),
})

type Result = 
  | {
      original_url: string
      replayed_url: string
      method: string
      status: number
      duration_ms: number
      response_headers: Record<string, string>
      body_excerpt: string
    }
  | { error: string }

async function execute(params: Params): Promise<Result> {
  const req = RequestStore.getInstance().getById(params.request_id)
  if (!req) return { error: `Request ${params.request_id} not found` }

  const method = params.override_method ?? req.method
  const url = params.override_url ?? req.url
  const headers: Record<string, string> = { ...req.requestHeaders }

  // Merge override headers
  if (params.override_headers) {
    for (const [k, v] of Object.entries(params.override_headers)) {
      headers[k] = v
    }
  }

  let body: string | null = null
  if (params.override_body !== undefined) {
    body = params.override_body
  } else if (req.requestBodyKey) {
    try {
      const { data } = await BodyStore.getInstance().get(req.requestBodyKey, 0, 8192)
      body = data.toString('utf8')
    } catch {
      body = null
    }
  }

  try {
    const result = await fetchViaProxy(url, method, headers, body)
    return {
      original_url: req.url,
      replayed_url: url,
      method,
      status: result.status,
      duration_ms: result.durationMs,
      response_headers: result.responseHeaders,
      body_excerpt: result.body,
    }
  } catch (err) {
    return { error: `Replay failed: ${String(err)}` }
  }
}

export const httpReplay = defineTool({
  description:
    'Replay a captured HTTP request through the proxy with optional modifications. ' +
    'Use this to test how the server responds to parameter changes, header swaps, or method changes. ' +
    'All test traffic is routed through the MITM proxy so it appears in the Traffic tab.',
  parameters: paramsSchema,
  execute,
})
