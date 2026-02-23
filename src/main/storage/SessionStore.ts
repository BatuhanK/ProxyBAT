import { Database } from './Database'
import { v4 as uuidv4 } from 'uuid'
import type { ProxySession } from '@shared/types'

interface SessionRow {
  id: string
  name: string
  started_at: number
  ended_at: number | null
  status: string
  request_count: number
}

function rowToSession(row: SessionRow): ProxySession {
  return {
    id: row.id,
    name: row.name,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    status: row.status as ProxySession['status'],
    requestCount: row.request_count
  }
}

export class SessionStore {
  private static instance: SessionStore

  static getInstance(): SessionStore {
    if (!SessionStore.instance) {
      SessionStore.instance = new SessionStore()
    }
    return SessionStore.instance
  }

  private get db() {
    return Database.getInstance().getDb()
  }

  create(name?: string): ProxySession {
    const id = uuidv4()
    const now = Date.now()
    const sessionName = name ?? `Session ${new Date(now).toLocaleString()}`

    this.db
      .prepare(
        'INSERT INTO proxy_sessions (id, name, started_at, status) VALUES (?, ?, ?, ?)'
      )
      .run(id, sessionName, now, 'active')

    return this.getById(id)!
  }

  getById(id: string): ProxySession | null {
    const row = this.db
      .prepare('SELECT * FROM proxy_sessions WHERE id = ?')
      .get(id) as SessionRow | undefined
    return row ? rowToSession(row) : null
  }

  list(): ProxySession[] {
    const rows = this.db
      .prepare('SELECT * FROM proxy_sessions ORDER BY started_at DESC')
      .all() as SessionRow[]
    return rows.map(rowToSession)
  }

  update(id: string, fields: { name?: string; status?: string; endedAt?: number | null }): boolean {
    const updates: string[] = []
    const values: unknown[] = []

    if (fields.name !== undefined) {
      updates.push('name = ?')
      values.push(fields.name)
    }
    if (fields.status !== undefined) {
      updates.push('status = ?')
      values.push(fields.status)
    }
    if (fields.endedAt !== undefined) {
      updates.push('ended_at = ?')
      values.push(fields.endedAt)
    }

    if (updates.length === 0) return false

    values.push(id)
    const result = this.db
      .prepare(`UPDATE proxy_sessions SET ${updates.join(', ')} WHERE id = ?`)
      .run(...values)
    return result.changes > 0
  }

  stop(id: string): boolean {
    return this.update(id, { status: 'stopped', endedAt: Date.now() })
  }

  reactivate(id: string): ProxySession | null {
    const row = this.db
      .prepare('SELECT * FROM proxy_sessions WHERE id = ?')
      .get(id) as SessionRow | undefined

    if (!row) return null

    this.db
      .prepare("UPDATE proxy_sessions SET status = 'active', ended_at = NULL WHERE id = ?")
      .run(id)

    return this.getById(id)
  }

  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM proxy_sessions WHERE id = ?').run(id)
    return result.changes > 0
  }

  merge(sourceId: string, targetId: string): boolean {
    const mergeRequests = this.db.transaction(() => {
      this.db
        .prepare('UPDATE requests SET session_id = ? WHERE session_id = ?')
        .run(targetId, sourceId)

      // Recalculate request count on target
      const count = (
        this.db
          .prepare('SELECT COUNT(*) as cnt FROM requests WHERE session_id = ?')
          .get(targetId) as { cnt: number }
      ).cnt
      this.db
        .prepare('UPDATE proxy_sessions SET request_count = ? WHERE id = ?')
        .run(count, targetId)

      this.db.prepare('DELETE FROM proxy_sessions WHERE id = ?').run(sourceId)
    })

    try {
      mergeRequests()
      return true
    } catch {
      return false
    }
  }

  incrementRequestCount(id: string): void {
    this.db
      .prepare('UPDATE proxy_sessions SET request_count = request_count + 1 WHERE id = ?')
      .run(id)
  }
}
