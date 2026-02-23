import { z } from 'zod'
import { RequestStore } from '../../../storage/RequestStore'
import { BodyStore } from '../../../storage/BodyStore'
import { fetchViaProxy } from './helpers'
import { defineTool } from '../toolFactory'

/**
 * Check Rate Limit Tool
 * Send N identical requests in rapid succession to test if an endpoint enforces rate limiting.
 * Detects 429 responses, increasing latency, or behavioral changes that indicate throttling.
 */

type Params = z.infer<typeof paramsSchema>

const paramsSchema = z.object({
  request_id: z.string().describe('ID of the request to rate-limit test'),
  count: z
    .number()
    .int()
    .min(2)
    .max(100)
    .default(20)
    .describe('Number of requests to send'),
  delay_ms: z
    .number()
    .int()
    .min(0)
    .max(1000)
    .default(0)
    .describe('Delay between requests in ms (0 = fire as fast as possible)'),
})

type RateLimitResult = 
  | {
      url: string
      total_requests: number
      success_count: number
      rate_limited_count: number
      error_count: number
      avg_duration_ms: number
      latency_trend: string
      rate_limit_detected: boolean
      results: Array<{ seq: number; status: number; duration_ms: number }>
      summary: string
    }
  | { error: string }

async function execute(params: Params): Promise<RateLimitResult> {
  const req = RequestStore.getInstance().getById(params.request_id)
  if (!req) return { error: `Request ${params.request_id} not found` }

  let body: string | null = null
  if (req.requestBodyKey) {
    try {
      const { data } = await BodyStore.getInstance().get(req.requestBodyKey, 0, 65536)
      body = data.toString('utf8')
    } catch {
      body = null
    }
  }

  const results: Array<{ seq: number; status: number; duration_ms: number }> = []

  for (let i = 0; i < params.count; i++) {
    try {
      const res = await fetchViaProxy(req.url, req.method, req.requestHeaders, body)
      results.push({ seq: i + 1, status: res.status, duration_ms: res.durationMs })
    } catch {
      results.push({ seq: i + 1, status: -1, duration_ms: 0 })
    }

    if (params.delay_ms > 0) {
      await new Promise((r) => setTimeout(r, params.delay_ms))
    }
  }

  const rateLimitedCount = results.filter((r) => r.status === 429).length
  const errorCount = results.filter((r) => r.status >= 500).length
  const successCount = results.filter((r) => r.status >= 200 && r.status < 300).length
  const avgDuration =
    results.reduce((sum, r) => sum + r.duration_ms, 0) / results.length

  const durations = results.map((r) => r.duration_ms)
  const latencyTrend =
    durations[durations.length - 1] - durations[0] > 500
      ? 'increasing (possible throttling)'
      : 'stable'

  return {
    url: req.url,
    total_requests: params.count,
    success_count: successCount,
    rate_limited_count: rateLimitedCount,
    error_count: errorCount,
    avg_duration_ms: Math.round(avgDuration),
    latency_trend: latencyTrend,
    rate_limit_detected: rateLimitedCount > 0,
    results,
    summary:
      rateLimitedCount > 0
        ? `Rate limiting DETECTED — ${rateLimitedCount}/${params.count} requests returned 429`
        : `No rate limiting detected — ${successCount}/${params.count} requests succeeded`,
  }
}

export const checkRateLimit = defineTool({
  description:
    'Send N identical requests in rapid succession to test if an endpoint enforces rate limiting. ' +
    'Detects 429 responses, increasing latency, or behavioral changes that indicate throttling.',
  parameters: paramsSchema,
  execute,
})
