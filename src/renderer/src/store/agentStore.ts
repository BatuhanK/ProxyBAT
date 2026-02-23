import { create } from 'zustand'
import type { AgentRole } from '@shared/ipc-contracts'

export type { AgentRole }

// A single ordered timeline item — either a chat message or a tool call card.
export type TimelineItem =
  | { kind: 'message'; id: string; role: 'user' | 'assistant'; content: string; timestamp: number; isStreaming?: boolean }
  | { kind: 'tool'; id: string; name: string; args: string; result?: string; isRunning: boolean }

export type AgentMessage = Extract<TimelineItem, { kind: 'message' }>
export type AgentToolCall = Extract<TimelineItem, { kind: 'tool' }>

export interface ChatSessionSummary {
  id: string
  title: string
  role: AgentRole
  linkedProxySessionId: string | null
  updatedAt: number
}

interface AgentState {
  timeline: TimelineItem[]
  isThinking: boolean
  currentSessionId: string | null
  currentRole: AgentRole
  sessions: ChatSessionSummary[]

  addUserMessage: (content: string) => void
  appendStreamText: (text: string) => void
  finalizeStream: (sessionId?: string) => void
  addToolCall: (id: string, name: string, args: string) => void
  updateToolCall: (id: string, result: string) => void
  setThinking: (v: boolean) => void
  reset: () => void
  sendMessage: (message: string, linkedProxySessionId?: string) => Promise<void>
  handleAgentEvent: (event: unknown) => void

  /** Start a new session with a specific role */
  startSession: (role: AgentRole, proxySessionId?: string) => Promise<void>
  /** Load session list from backend */
  fetchSessions: () => Promise<void>
  /** Switch to an existing session — loads its messages */
  loadSession: (sessionId: string) => Promise<void>
  /** Delete a session */
  deleteSession: (sessionId: string) => Promise<void>
  /** Update a session title in local list (from push event) */
  updateSessionTitle: (sessionId: string, title: string) => void
  /** Update the linked proxy session for a chat session */
  updateSessionProxy: (sessionId: string, linkedProxySessionId: string | null) => Promise<void>
}

let idCounter = 0
const nextId = () => `item-${++idCounter}`

export const useAgentStore = create<AgentState>((set, get) => ({
  timeline: [],
  isThinking: false,
  currentSessionId: null,
  currentRole: 'general',
  sessions: [],

  addUserMessage: (content) => {
    set((state) => ({
      timeline: [
        ...state.timeline,
        { kind: 'message', id: nextId(), role: 'user', content, timestamp: Date.now() }
      ]
    }))
  },

  appendStreamText: (text) => {
    set((state) => {
      const timeline = [...state.timeline]
      const last = timeline[timeline.length - 1]

      if (last && last.kind === 'message' && last.role === 'assistant' && last.isStreaming) {
        timeline[timeline.length - 1] = { ...last, content: last.content + text }
      } else {
        timeline.push({
          kind: 'message',
          id: nextId(),
          role: 'assistant',
          content: text,
          timestamp: Date.now(),
          isStreaming: true
        })
      }
      return { timeline }
    })
  },

  finalizeStream: (sessionId?: string) => {
    // Always clear isThinking — even if user switched to another session.
    // The backend has already persisted the full turn; if user returns to
    // that session, loadSession will show the complete history.
    set((state) => {
      const isCurrent = !sessionId || sessionId === state.currentSessionId
      return {
        timeline: isCurrent
          ? state.timeline.map((item) =>
              item.kind === 'message' && item.isStreaming ? { ...item, isStreaming: false } : item
            )
          : state.timeline,
        isThinking: false,
      }
    })
    // Refresh session list so title updates appear
    get().fetchSessions()
  },

  addToolCall: (id, name, args) => {
    set((state) => ({
      timeline: [
        ...state.timeline,
        { kind: 'tool', id, name, args, isRunning: true }
      ]
    }))
  },

  updateToolCall: (id, result) => {
    set((state) => ({
      timeline: state.timeline.map((item) =>
        item.kind === 'tool' && item.id === id
          ? { ...item, result, isRunning: false }
          : item
      )
    }))
  },

  setThinking: (v) => set({ isThinking: v }),

  reset: () => set({ timeline: [], isThinking: false, currentSessionId: null, currentRole: 'general' }),

  sendMessage: async (message, linkedProxySessionId) => {
    const { addUserMessage, setThinking, currentSessionId } = get()
    addUserMessage(message)
    setThinking(true)

    try {
      const result = await window.api.agent.prompt({
        message,
        sessionId: currentSessionId ?? undefined,
        linkedProxySessionId: currentSessionId ? undefined : linkedProxySessionId,
      })

      // If the backend auto-created a new session (i.e. we had no currentSessionId),
      // update the store so stream events and the sidebar both resolve to this session.
      if (result?.sessionId && !currentSessionId) {
        set({ currentSessionId: result.sessionId })
        get().fetchSessions()
      }
    } catch (err) {
      console.error('[agent:sendMessage] prompt error', err)
      setThinking(false)
    }
  },

  handleAgentEvent: (event: unknown) => {
    const e = event as { type: string; text?: string; id?: string; name?: string; args?: string; result?: string; sessionId?: string; message?: string }
    const { appendStreamText, addToolCall, updateToolCall, setThinking } = get()

    // If we have no active session yet (first message from empty state) and the backend
    // tells us which session this event belongs to, adopt it immediately so all events
    // from this turn are rendered and the sidebar highlights the right session.
    if (!get().currentSessionId && e.sessionId) {
      set({ currentSessionId: e.sessionId })
      get().fetchSessions()
    }

    const currentSessionId = get().currentSessionId
    const isCurrentSession = !e.sessionId || e.sessionId === currentSessionId

    switch (e.type) {
      case 'text_delta':
        if (!isCurrentSession) break
        setThinking(false)
        if (e.text) appendStreamText(e.text)
        break
      case 'tool_start':
        if (!isCurrentSession) break
        addToolCall(e.id!, e.name!, e.args ?? '')
        break
      case 'tool_done':
        if (!isCurrentSession) break
        updateToolCall(e.id!, e.result ?? '')
        break
      case 'agent_error':
        console.error('[agent:handleAgentEvent] agent_error', e.message)
        if (!isCurrentSession) break
        setThinking(false)
        set((state) => ({
          timeline: [
            ...state.timeline,
            {
              kind: 'message' as const,
              id: nextId(),
              role: 'assistant' as const,
              content: `Error: ${e.message ?? 'Unknown error'}`,
              timestamp: Date.now(),
            }
          ]
        }))
        break
    }
  },

  startSession: async (role: AgentRole, proxySessionId?: string) => {
    try {
      let linkedSessionId: string | undefined
      if (role === 'poc_creator' || role === 'poc_tester') {
        const { sessions } = get()
        const researcherSessions = sessions
          .filter((s) => s.role === 'security_researcher')
          .sort((a, b) => b.updatedAt - a.updatedAt)
        linkedSessionId = researcherSessions[0]?.id
      }

      const result = await window.api.agent.startSession({
        role,
        linkedSessionId,
        linkedProxySessionId: proxySessionId,
      })
      if (result.sessionId) {
        set({
          timeline: [],
          isThinking: false,
          currentSessionId: result.sessionId,
          currentRole: role,
        })
        get().fetchSessions()
      } else {
        console.warn('[agent:startSession] result had no sessionId', result)
      }
    } catch (err) {
      console.error('[agent:startSession] error', err)
    }
  },

  fetchSessions: async () => {
    try {
      const result = await window.api.agent.getSessions() as { sessions?: Array<{ id: string; title: string; role: AgentRole; linkedProxySessionId: string | null; updatedAt: number }> }
      set({ sessions: result.sessions ?? [] })
    } catch (err) {
      console.error('[agent:fetchSessions] error', err)
    }
  },

  loadSession: async (sessionId: string) => {
    try {
      const result = await window.api.agent.loadSession({ sessionId })
      const messages = (result.messages ?? []) as Array<{ role: string; content: string; created_at: number }>

      const timeline: TimelineItem[] = messages.map((m) => ({
        kind: 'message' as const,
        id: nextId(),
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.created_at,
      }))

      const { sessions } = get()
      const session = sessions.find((s) => s.id === sessionId)
      const role: AgentRole = session?.role ?? 'general'

      set({ timeline, currentSessionId: sessionId, currentRole: role, isThinking: false })
    } catch (err) {
      console.error('[agent:loadSession] error', err)
    }
  },

  deleteSession: async (sessionId: string) => {
    try {
      await window.api.agent.deleteSession({ sessionId })
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== sessionId),
        ...(state.currentSessionId === sessionId
          ? { timeline: [], currentSessionId: null, currentRole: 'general', isThinking: false }
          : {})
      }))
    } catch (err) {
      console.error('[agent:deleteSession] error', err)
    }
  },

  updateSessionTitle: (sessionId: string, title: string) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, title } : s
      )
    }))
  },

  updateSessionProxy: async (sessionId: string, linkedProxySessionId: string | null) => {
    try {
      await window.api.agent.updateSession({ sessionId, linkedProxySessionId })
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? { ...s, linkedProxySessionId } : s
        )
      }))
    } catch {
      /* ignore */
    }
  },
}))
