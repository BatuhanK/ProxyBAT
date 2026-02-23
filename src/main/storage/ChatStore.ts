import { Database } from './Database'
import { v4 as uuidv4 } from 'uuid'
import type { AgentRole } from '../agent/agents/registry'

export interface ChatSessionRow {
  id: string
  title: string
  role: AgentRole
  linked_proxy_session_id: string | null
  created_at: number
  updated_at: number
}

export interface ChatMessageRow {
  id: string
  session_id: string
  role: string
  content: string
  created_at: number
}

export class ChatStore {
  private static instance: ChatStore

  static getInstance(): ChatStore {
    if (!ChatStore.instance) {
      ChatStore.instance = new ChatStore()
    }
    return ChatStore.instance
  }

  private get db() {
    return Database.getInstance().getDb()
  }

  // ─── Sessions ──────────────────────────────────────────────────────────────

  createSession(id?: string, role: AgentRole = 'general', linkedProxySessionId?: string): ChatSessionRow {
    const row: ChatSessionRow = {
      id: id ?? uuidv4(),
      title: 'New Chat',
      role,
      linked_proxy_session_id: linkedProxySessionId ?? null,
      created_at: Date.now(),
      updated_at: Date.now()
    }
    this.db
      .prepare(
        'INSERT INTO chat_sessions (id, title, role, linked_proxy_session_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(row.id, row.title, row.role, row.linked_proxy_session_id, row.created_at, row.updated_at)
    return row
  }

  getSession(id: string): ChatSessionRow | null {
    return (
      (this.db
        .prepare('SELECT * FROM chat_sessions WHERE id = ?')
        .get(id) as ChatSessionRow | undefined) ?? null
    )
  }

  listSessions(): ChatSessionRow[] {
    return this.db
      .prepare('SELECT * FROM chat_sessions ORDER BY updated_at DESC')
      .all() as ChatSessionRow[]
  }

  updateTitle(id: string, title: string): void {
    this.db
      .prepare('UPDATE chat_sessions SET title = ?, updated_at = ? WHERE id = ?')
      .run(title, Date.now(), id)
  }

  updateLinkedProxySession(id: string, linkedProxySessionId: string | null): void {
    this.db
      .prepare('UPDATE chat_sessions SET linked_proxy_session_id = ?, updated_at = ? WHERE id = ?')
      .run(linkedProxySessionId, Date.now(), id)
  }

  touchSession(id: string): void {
    this.db
      .prepare('UPDATE chat_sessions SET updated_at = ? WHERE id = ?')
      .run(Date.now(), id)
  }

  deleteSession(id: string): void {
    this.db.prepare('DELETE FROM chat_sessions WHERE id = ?').run(id)
  }

  // ─── Messages ──────────────────────────────────────────────────────────────

  appendMessage(sessionId: string, role: string, content: string): ChatMessageRow {
    const row: ChatMessageRow = {
      id: uuidv4(),
      session_id: sessionId,
      role,
      content,
      created_at: Date.now()
    }
    this.db
      .prepare(
        'INSERT INTO chat_messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
      )
      .run(row.id, row.session_id, row.role, row.content, row.created_at)
    this.touchSession(sessionId)
    return row
  }

  listMessages(sessionId: string): ChatMessageRow[] {
    return this.db
      .prepare('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC')
      .all(sessionId) as ChatMessageRow[]
  }

  clearMessages(sessionId: string): void {
    this.db.prepare('DELETE FROM chat_messages WHERE session_id = ?').run(sessionId)
  }

  messageCount(sessionId: string): number {
    const row = this.db
      .prepare('SELECT COUNT(*) as cnt FROM chat_messages WHERE session_id = ?')
      .get(sessionId) as { cnt: number }
    return row.cnt
  }
}
