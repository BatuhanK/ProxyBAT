import { Database } from './Database'
import { v4 as uuidv4 } from 'uuid'
import type { SslRule } from '@shared/types'

interface SslRuleRow {
  id: string
  pattern: string
  enabled: number
  created_at: number
}

function rowToRule(row: SslRuleRow): SslRule {
  return {
    id: row.id,
    pattern: row.pattern,
    enabled: row.enabled === 1,
    createdAt: row.created_at
  }
}

export class SslRuleStore {
  private static instance: SslRuleStore

  static getInstance(): SslRuleStore {
    if (!SslRuleStore.instance) {
      SslRuleStore.instance = new SslRuleStore()
    }
    return SslRuleStore.instance
  }

  private get db() {
    return Database.getInstance().getDb()
  }

  create(pattern: string, enabled = true): SslRule {
    const id = uuidv4()
    const now = Date.now()
    this.db
      .prepare('INSERT INTO ssl_rules (id, pattern, enabled, created_at) VALUES (?, ?, ?, ?)')
      .run(id, pattern, enabled ? 1 : 0, now)
    return this.getById(id)!
  }

  getById(id: string): SslRule | null {
    const row = this.db
      .prepare('SELECT * FROM ssl_rules WHERE id = ?')
      .get(id) as SslRuleRow | undefined
    return row ? rowToRule(row) : null
  }

  list(): SslRule[] {
    const rows = this.db
      .prepare('SELECT * FROM ssl_rules ORDER BY created_at ASC')
      .all() as SslRuleRow[]
    return rows.map(rowToRule)
  }

  listEnabled(): SslRule[] {
    const rows = this.db
      .prepare('SELECT * FROM ssl_rules WHERE enabled = 1')
      .all() as SslRuleRow[]
    return rows.map(rowToRule)
  }

  update(id: string, fields: { pattern?: string; enabled?: boolean }): boolean {
    const updates: string[] = []
    const values: unknown[] = []

    if (fields.pattern !== undefined) {
      updates.push('pattern = ?')
      values.push(fields.pattern)
    }
    if (fields.enabled !== undefined) {
      updates.push('enabled = ?')
      values.push(fields.enabled ? 1 : 0)
    }

    if (updates.length === 0) return false

    values.push(id)
    const result = this.db
      .prepare(`UPDATE ssl_rules SET ${updates.join(', ')} WHERE id = ?`)
      .run(...values)
    return result.changes > 0
  }

  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM ssl_rules WHERE id = ?').run(id)
    return result.changes > 0
  }
}
