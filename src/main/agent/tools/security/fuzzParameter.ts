import { z } from 'zod'
import { RequestStore } from '../../../storage/RequestStore'
import { BodyStore } from '../../../storage/BodyStore'
import { fetchViaProxy } from './helpers'
import { defineTool } from '../toolFactory'

/**
 * Fuzz Parameter Tool
 * Send multiple requests to an endpoint with different values for a specific parameter.
 * Useful for testing IDOR, injection, or enumeration vulnerabilities.
 * Returns a diff table showing status codes and response size for each value.
 */

type Params = z.infer<typeof paramsSchema>

const paramsSchema = z.object({
  request_id: z.string().describe('ID of the base request to fuzz'),
  parameter_location: z
    .enum(['body_json', 'body_form', 'query', 'header', 'path'])
    .describe('Where the parameter lives'),
  parameter_name: z.string().describe('Name of the parameter to fuzz'),
  values: z
    .array(z.string())
    .min(1)
    .max(50)
    .describe('List of values to test (max 50)'),
  delay_ms: z
    .number()
    .int()
    .min(0)
    .max(5000)
    .default(0)
    .describe('Delay between requests in milliseconds'),
})

type FuzzResult = {
  value: string
  status: number
  duration_ms: number
  body_length: number
  body_excerpt: string
}

type Result = 
  | {
      parameter: string
      location: string
      total_requests: number
      results: FuzzResult[]
      anomalies: FuzzResult[] | null
      summary: string
    }
  | { error: string }

async function execute(params: Params): Promise<Result> {
  const req = RequestStore.getInstance().getById(params.request_id)
  if (!req) return { error: `Request ${params.request_id} not found` }

  const results: FuzzResult[] = []

  let baseBody: string | null = null
  if (req.requestBodyKey) {
    try {
      const { data } = await BodyStore.getInstance().get(req.requestBodyKey, 0, 65536)
      baseBody = data.toString('utf8')
    } catch {
      baseBody = null
    }
  }

  let baseUrl = req.url

  for (const value of params.values) {
    let url = baseUrl
    let body = baseBody
    const headers: Record<string, string> = { ...req.requestHeaders }

    if (params.parameter_location === 'query') {
      const u = new URL(baseUrl)
      u.searchParams.set(params.parameter_name, value)
      url = u.toString()
    } else if (params.parameter_location === 'path') {
      // Replace last path segment or param placeholder
      url = baseUrl.replace(
        new RegExp(`(/${params.parameter_name}/)[^/?]+`),
        `$1${encodeURIComponent(value)}`,
      )
    } else if (params.parameter_location === 'header') {
      headers[params.parameter_name] = value
    } else if (params.parameter_location === 'body_json' && body) {
      try {
        const obj = JSON.parse(body)
        obj[params.parameter_name] = value
        body = JSON.stringify(obj)
      } catch {
        body = body
      }
    } else if (params.parameter_location === 'body_form' && body) {
      const form = new URLSearchParams(body)
      form.set(params.parameter_name, value)
      body = form.toString()
    }

    try {
      const res = await fetchViaProxy(url, req.method, headers, body)
      results.push({
        value,
        status: res.status,
        duration_ms: res.durationMs,
        body_length: res.body.length,
        body_excerpt: res.body.slice(0, 200),
      })
    } catch (err) {
      results.push({
        value,
        status: -1,
        duration_ms: 0,
        body_length: 0,
        body_excerpt: `Error: ${String(err)}`,
      })
    }

    if (params.delay_ms > 0) {
      await new Promise((r) => setTimeout(r, params.delay_ms))
    }
  }

  // Detect anomalies: responses that differ from the majority
  const statusCounts = new Map<number, number>()
  for (const r of results) {
    statusCounts.set(r.status, (statusCounts.get(r.status) ?? 0) + 1)
  }
  const dominantStatus = [...statusCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  const anomalies = results.filter((r) => r.status !== dominantStatus)

  return {
    parameter: params.parameter_name,
    location: params.parameter_location,
    total_requests: results.length,
    results,
    anomalies: anomalies.length > 0 ? anomalies : null,
    summary: `Sent ${results.length} requests. Dominant status: ${dominantStatus}. Anomalies: ${anomalies.length}`,
  }
}

export const fuzzParameter = defineTool({
  description:
    'Send multiple requests to an endpoint with different values for a specific parameter. ' +
    'Useful for testing IDOR, injection, or enumeration vulnerabilities. ' +
    'Returns a diff table showing status codes and response size for each value.',
  parameters: paramsSchema,
  execute,
})
