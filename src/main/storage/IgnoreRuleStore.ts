import { Database } from './Database'
import { v4 as uuidv4 } from 'uuid'
import type { IgnoreRule } from '@shared/types'

interface IgnoreRuleRow {
  id: string
  pattern: string
  enabled: number
  created_at: number
}

function rowToRule(row: IgnoreRuleRow): IgnoreRule {
  return {
    id: row.id,
    pattern: row.pattern,
    enabled: row.enabled === 1,
    createdAt: row.created_at,
  }
}

/**
 * Converts a wildcard glob pattern (supporting * and ?) into a RegExp.
 * ** is treated the same as * (matches any sequence including /).
 */
export function wildcardToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')  // escape regex specials except * and ?
    .replace(/\*+/g, '.*')                  // * / ** → .*
    .replace(/\?/g, '.')                    // ? → .
  return new RegExp(`^${escaped}$`, 'i')
}

export class IgnoreRuleStore {
  private static instance: IgnoreRuleStore

  static getInstance(): IgnoreRuleStore {
    if (!IgnoreRuleStore.instance) {
      IgnoreRuleStore.instance = new IgnoreRuleStore()
    }
    return IgnoreRuleStore.instance
  }

  private get db() {
    return Database.getInstance().getDb()
  }

  list(): IgnoreRule[] {
    const rows = this.db
      .prepare('SELECT * FROM ignore_rules ORDER BY created_at ASC')
      .all() as IgnoreRuleRow[]
    return rows.map(rowToRule)
  }

  listEnabled(): IgnoreRule[] {
    const rows = this.db
      .prepare('SELECT * FROM ignore_rules WHERE enabled = 1 ORDER BY created_at ASC')
      .all() as IgnoreRuleRow[]
    return rows.map(rowToRule)
  }

  create(pattern: string, enabled = true): IgnoreRule {
    const id = uuidv4()
    const now = Date.now()
    this.db
      .prepare(
        'INSERT INTO ignore_rules (id, pattern, enabled, created_at) VALUES (?, ?, ?, ?)'
      )
      .run(id, pattern, enabled ? 1 : 0, now)
    return rowToRule(
      this.db.prepare('SELECT * FROM ignore_rules WHERE id = ?').get(id) as IgnoreRuleRow
    )
  }

  update(id: string, params: { pattern?: string; enabled?: boolean }): boolean {
    const updates: string[] = []
    const values: unknown[] = []

    if (params.pattern !== undefined) {
      updates.push('pattern = ?')
      values.push(params.pattern)
    }
    if (params.enabled !== undefined) {
      updates.push('enabled = ?')
      values.push(params.enabled ? 1 : 0)
    }

    if (updates.length === 0) return false

    values.push(id)
    const result = this.db
      .prepare(`UPDATE ignore_rules SET ${updates.join(', ')} WHERE id = ?`)
      .run(...values)
    return result.changes > 0
  }

  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM ignore_rules WHERE id = ?').run(id)
    return result.changes > 0
  }

  /**
   * Returns true if the given URL matches any enabled ignore rule.
   */
  shouldIgnore(url: string): boolean {
    const rules = this.listEnabled()
    return rules.some((rule) => {
      try {
        return wildcardToRegex(rule.pattern).test(url)
      } catch {
        return false
      }
    })
  }
}
