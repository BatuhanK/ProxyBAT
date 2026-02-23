import { Database } from './Database'
import { v4 as uuidv4 } from 'uuid'
import type { InterceptScript } from '@shared/types'

interface ScriptRow {
  id: string
  name: string
  code: string
  enabled: number
  phase: string
  created_at: number
  updated_at: number
}

function rowToScript(row: ScriptRow): InterceptScript {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    enabled: row.enabled === 1,
    phase: row.phase as InterceptScript['phase'],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export class ScriptStore {
  private static instance: ScriptStore

  static getInstance(): ScriptStore {
    if (!ScriptStore.instance) {
      ScriptStore.instance = new ScriptStore()
    }
    return ScriptStore.instance
  }

  private get db() {
    return Database.getInstance().getDb()
  }

  create(params: {
    name: string
    code?: string
    phase?: InterceptScript['phase']
    enabled?: boolean
  }): InterceptScript {
    const id = uuidv4()
    const now = Date.now()
    this.db
      .prepare(
        'INSERT INTO scripts (id, name, code, enabled, phase, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        id,
        params.name,
        params.code ?? '',
        params.enabled !== false ? 1 : 0,
        params.phase ?? 'both',
        now,
        now
      )
    return this.getById(id)!
  }

  getById(id: string): InterceptScript | null {
    const row = this.db
      .prepare('SELECT * FROM scripts WHERE id = ?')
      .get(id) as ScriptRow | undefined
    return row ? rowToScript(row) : null
  }

  list(): InterceptScript[] {
    const rows = this.db
      .prepare('SELECT * FROM scripts ORDER BY created_at ASC')
      .all() as ScriptRow[]
    return rows.map(rowToScript)
  }

  listEnabled(): InterceptScript[] {
    const rows = this.db
      .prepare('SELECT * FROM scripts WHERE enabled = 1')
      .all() as ScriptRow[]
    return rows.map(rowToScript)
  }

  update(
    id: string,
    fields: { name?: string; code?: string; phase?: InterceptScript['phase']; enabled?: boolean }
  ): boolean {
    const updates: string[] = ['updated_at = ?']
    const values: unknown[] = [Date.now()]

    if (fields.name !== undefined) {
      updates.push('name = ?')
      values.push(fields.name)
    }
    if (fields.code !== undefined) {
      updates.push('code = ?')
      values.push(fields.code)
    }
    if (fields.phase !== undefined) {
      updates.push('phase = ?')
      values.push(fields.phase)
    }
    if (fields.enabled !== undefined) {
      updates.push('enabled = ?')
      values.push(fields.enabled ? 1 : 0)
    }

    values.push(id)
    const result = this.db
      .prepare(`UPDATE scripts SET ${updates.join(', ')} WHERE id = ?`)
      .run(...values)
    return result.changes > 0
  }

  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM scripts WHERE id = ?').run(id)
    return result.changes > 0
  }
}
