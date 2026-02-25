import { Database } from './Database'
import { v4 as uuidv4 } from 'uuid'
import { SessionStore } from './SessionStore'
import type { HttpRequest, SessionSummary } from '@shared/types'
import { RESOURCE_TYPE_CONTENT_PATTERNS, type ResourceType } from '@shared/resourceType'

interface RequestRow {
  id: string
  session_id: string
  timestamp: number
  method: string
  url: string
  host: string
  path: string
  status_code: number | null
  request_headers: string
  response_headers: string
  request_body_key: string | null
  response_body_key: string | null
  request_body_size: number | null
  response_body_size: number | null
  content_type: string | null
  duration_ms: number | null
  ssl_intercepted: number
}

function rowToRequest(row: RequestRow): HttpRequest {
  return {
    id: row.id,
    sessionId: row.session_id,
    timestamp: row.timestamp,
    method: row.method,
    url: row.url,
    host: row.host,
    path: row.path,
    statusCode: row.status_code,
    requestHeaders: JSON.parse(row.request_headers || '{}'),
    responseHeaders: JSON.parse(row.response_headers || '{}'),
    requestBodyKey: row.request_body_key,
    responseBodyKey: row.response_body_key,
    requestBodySize: row.request_body_size ?? null,
    responseBodySize: row.response_body_size ?? null,
    contentType: row.content_type,
    durationMs: row.duration_ms,
    sslIntercepted: row.ssl_intercepted === 1
  }
}

export interface CreateRequestParams {
  id?: string
  sessionId: string
  method: string
  url: string
  host: string
  path: string
  requestHeaders: Record<string, string>
  requestBodyKey?: string | null
  requestBodySize?: number | null
  sslIntercepted?: boolean
  timestamp?: number
}

export interface UpdateRequestParams {
  statusCode?: number
  responseHeaders?: Record<string, string>
  responseBodyKey?: string | null
  responseBodySize?: number | null
  contentType?: string | null
  durationMs?: number | null
}

export interface ListRequestsParams {
  sessionId: string
  limit?: number
  offset?: number
  search?: string
  method?: string
  host?: string
  statusCode?: number
  statusCategory?: '2xx' | '3xx' | '4xx' | '5xx'
}

export interface DeleteFilteredParams {
  sessionId: string
  search?: string
  method?: string
  statusCategory?: string
  /** Resource type — translated to content_type LIKE patterns */
  resourceType?: string
  /** If true, delete rows NOT matching the filter */
  invert?: boolean
}

export class RequestStore {
  private static instance: RequestStore

  static getInstance(): RequestStore {
    if (!RequestStore.instance) {
      RequestStore.instance = new RequestStore()
    }
    return RequestStore.instance
  }

  private get db() {
    return Database.getInstance().getDb()
  }

  create(params: CreateRequestParams): HttpRequest {
    const id = params.id ?? uuidv4()
    const now = params.timestamp ?? Date.now()

    this.db
      .prepare(
        `INSERT INTO requests
          (id, session_id, timestamp, method, url, host, path,
           request_headers, request_body_key, request_body_size, ssl_intercepted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        params.sessionId,
        now,
        params.method.toUpperCase(),
        params.url,
        params.host,
        params.path,
        JSON.stringify(params.requestHeaders || {}),
        params.requestBodyKey ?? null,
        params.requestBodySize ?? null,
        params.sslIntercepted ? 1 : 0
      )

    SessionStore.getInstance().incrementRequestCount(params.sessionId)
    return this.getById(id)!
  }

  update(id: string, params: UpdateRequestParams): boolean {
    const updates: string[] = []
    const values: unknown[] = []

    if (params.statusCode !== undefined) {
      updates.push('status_code = ?')
      values.push(params.statusCode)
    }
    if (params.responseHeaders !== undefined) {
      updates.push('response_headers = ?')
      values.push(JSON.stringify(params.responseHeaders))
    }
    if (params.responseBodyKey !== undefined) {
      updates.push('response_body_key = ?')
      values.push(params.responseBodyKey)
    }
    if (params.responseBodySize !== undefined) {
      updates.push('response_body_size = ?')
      values.push(params.responseBodySize)
    }
    if (params.contentType !== undefined) {
      updates.push('content_type = ?')
      values.push(params.contentType)
    }
    if (params.durationMs !== undefined) {
      updates.push('duration_ms = ?')
      values.push(params.durationMs)
    }

    if (updates.length === 0) return false

    values.push(id)
    const result = this.db
      .prepare(`UPDATE requests SET ${updates.join(', ')} WHERE id = ?`)
      .run(...values)
    return result.changes > 0
  }

  getById(id: string): HttpRequest | null {
    const row = this.db
      .prepare('SELECT * FROM requests WHERE id = ?')
      .get(id) as RequestRow | undefined
    return row ? rowToRequest(row) : null
  }

  list(params: ListRequestsParams): { requests: HttpRequest[]; total: number } {
    const conditions: string[] = ['r.session_id = ?']
    const values: unknown[] = [params.sessionId]

    if (params.method) {
      conditions.push('r.method = ?')
      values.push(params.method.toUpperCase())
    }
    if (params.host) {
      conditions.push('r.host LIKE ?')
      values.push(`%${params.host}%`)
    }
    if (params.statusCode) {
      conditions.push('r.status_code = ?')
      values.push(params.statusCode)
    }
    if (params.statusCategory) {
      const prefix = params.statusCategory[0]
      conditions.push(`r.status_code >= ${prefix}00 AND r.status_code < ${Number(prefix) + 1}00`)
    }
    if (params.search) {
      conditions.push('(r.url LIKE ? OR r.host LIKE ? OR r.path LIKE ?)')
      const like = `%${params.search}%`
      values.push(like, like, like)
    }

    const where = conditions.join(' AND ')
    const total = (
      this.db
        .prepare(`SELECT COUNT(*) as cnt FROM requests r WHERE ${where}`)
        .get(...values) as { cnt: number }
    ).cnt

    const limit = params.limit ?? 100
    const offset = params.offset ?? 0
    const rows = this.db
      .prepare(
        `SELECT r.* FROM requests r WHERE ${where}
         ORDER BY r.timestamp DESC LIMIT ? OFFSET ?`
      )
      .all(...values, limit, offset) as RequestRow[]

    return { requests: rows.map(rowToRequest), total }
  }

  delete(id: string): boolean {
    // Fetch session_id before deleting so we can recalculate the count
    const row = this.db
      .prepare('SELECT session_id FROM requests WHERE id = ?')
      .get(id) as { session_id: string } | undefined
    const result = this.db.prepare('DELETE FROM requests WHERE id = ?').run(id)
    if (result.changes > 0 && row) {
      this.recalculateRequestCount(row.session_id)
    }
    return result.changes > 0
  }

  clearSession(sessionId: string): number {
    const result = this.db.prepare('DELETE FROM requests WHERE session_id = ?').run(sessionId)
    if (result.changes > 0) {
      this.db
        .prepare('UPDATE proxy_sessions SET request_count = 0 WHERE id = ?')
        .run(sessionId)
    }
    return result.changes
  }

  deleteFiltered(params: DeleteFilteredParams): number {
    const filterConditions: string[] = []
    const values: unknown[] = [params.sessionId]

    if (params.method) {
      filterConditions.push('r.method = ?')
      values.push(params.method.toUpperCase())
    }
    if (params.statusCategory) {
      const prefix = params.statusCategory[0]
      filterConditions.push(`r.status_code >= ${prefix}00 AND r.status_code < ${Number(prefix) + 1}00`)
    }
    if (params.search) {
      filterConditions.push('(r.url LIKE ? OR r.host LIKE ? OR r.path LIKE ?)')
      const like = `%${params.search}%`
      values.push(like, like, like)
    }
    if (params.resourceType && params.resourceType in RESOURCE_TYPE_CONTENT_PATTERNS) {
      const patterns = RESOURCE_TYPE_CONTENT_PATTERNS[params.resourceType as ResourceType]
      if (patterns.length > 0) {
        const ctClauses = patterns.map(() => 'r.content_type LIKE ?').join(' OR ')
        filterConditions.push(`(${ctClauses})`)
        for (const p of patterns) values.push(p)
      }
    }

    let where = 'r.session_id = ?'
    if (filterConditions.length > 0) {
      const filterExpr = filterConditions.join(' AND ')
      if (params.invert) {
        // Delete rows that do NOT match the filter
        where = `r.session_id = ? AND NOT (${filterExpr})`
      } else {
        where = `r.session_id = ? AND ${filterExpr}`
      }
    }
    // If no filters at all and invert=true, nothing to delete
    if (filterConditions.length === 0 && params.invert) return 0

    const result = this.db
      .prepare(`DELETE FROM requests WHERE rowid IN (SELECT r.rowid FROM requests r WHERE ${where})`)
      .run(...values)
    if (result.changes > 0) {
      this.recalculateRequestCount(params.sessionId)
    }
    return result.changes
  }

  private recalculateRequestCount(sessionId: string): void {
    const countRow = this.db
      .prepare('SELECT COUNT(*) as cnt FROM requests WHERE session_id = ?')
      .get(sessionId) as { cnt: number }
    this.db
      .prepare('UPDATE proxy_sessions SET request_count = ? WHERE id = ?')
      .run(countRow.cnt, sessionId)
  }

  getSessionSummary(sessionId: string): SessionSummary | null {
    const session = Database.getInstance()
      .getDb()
      .prepare('SELECT * FROM proxy_sessions WHERE id = ?')
      .get(sessionId) as
      | {
          id: string
          name: string
          started_at: number
          ended_at: number | null
          status: string
          request_count: number
        }
      | undefined

    if (!session) return null

    const totalRow = this.db
      .prepare('SELECT COUNT(*) as cnt FROM requests WHERE session_id = ?')
      .get(sessionId) as { cnt: number }

    const domains = (
      this.db
        .prepare('SELECT DISTINCT host FROM requests WHERE session_id = ?')
        .all(sessionId) as Array<{ host: string }>
    ).map((r) => r.host)

    const statusBreakdown = this.db
      .prepare(
        `SELECT
          CASE
            WHEN status_code >= 500 THEN '5xx'
            WHEN status_code >= 400 THEN '4xx'
            WHEN status_code >= 300 THEN '3xx'
            WHEN status_code >= 200 THEN '2xx'
            ELSE 'other'
          END as category,
          COUNT(*) as cnt
         FROM requests WHERE session_id = ?
         GROUP BY category`
      )
      .all(sessionId) as Array<{ category: string; cnt: number }>

    const breakdown: Record<string, number> = {}
    for (const row of statusBreakdown) {
      breakdown[row.category] = row.cnt
    }

    const avgRow = this.db
      .prepare(
        'SELECT AVG(duration_ms) as avg FROM requests WHERE session_id = ? AND duration_ms IS NOT NULL'
      )
      .get(sessionId) as { avg: number | null }

    const errorCount = (
      this.db
        .prepare(
          'SELECT COUNT(*) as cnt FROM requests WHERE session_id = ? AND status_code >= 400'
        )
        .get(sessionId) as { cnt: number }
    ).cnt

    const sslCount = (
      this.db
        .prepare(
          'SELECT COUNT(*) as cnt FROM requests WHERE session_id = ? AND ssl_intercepted = 1'
        )
        .get(sessionId) as { cnt: number }
    ).cnt

    return {
      session: {
        id: session.id,
        name: session.name,
        startedAt: session.started_at,
        endedAt: session.ended_at,
        status: session.status as 'active' | 'stopped',
        requestCount: session.request_count
      },
      totalRequests: totalRow.cnt,
      domains,
      statusCodeBreakdown: breakdown,
      avgDurationMs: avgRow.avg,
      errorCount,
      sslInterceptedCount: sslCount
    }
  }
}
