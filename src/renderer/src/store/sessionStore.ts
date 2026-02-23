import { create } from 'zustand'
import type { ProxySession, HttpRequest } from '@shared/types'

interface DeleteFilteredParams {
  sessionId: string
  search?: string
  method?: string
  statusCategory?: string
  resourceType?: string
  invert?: boolean
}

interface SessionState {
  sessions: ProxySession[]
  activeViewSessionId: string | null
  requests: HttpRequest[]
  selectedRequestId: string | null
  requestTotal: number
  isLoadingRequests: boolean
  pinnedSessionId: string | null

  fetchSessions: () => Promise<void>
  setActiveViewSession: (id: string | null) => void
  fetchRequests: (params?: {
    search?: string
    method?: string
    host?: string
    statusCode?: number
    statusCategory?: string
    offset?: number
    limit?: number
  }) => Promise<void>
  appendRequest: (request: HttpRequest) => void
  setSelectedRequest: (id: string | null) => void
  deleteSession: (id: string) => Promise<void>
  mergeSessions: (sourceId: string, targetId: string) => Promise<void>
  clearSession: (sessionId: string) => Promise<void>
  setPinnedSession: (id: string | null) => void
  deleteFiltered: (params: DeleteFilteredParams) => Promise<{ deleted: number }>
}

function readPinnedSession(): string | null {
  try {
    return localStorage.getItem('session.pinned') ?? null
  } catch {
    return null
  }
}

function writePinnedSession(id: string | null): void {
  try {
    if (id === null) {
      localStorage.removeItem('session.pinned')
    } else {
      localStorage.setItem('session.pinned', id)
    }
  } catch { /* ignore */ }
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  activeViewSessionId: null,
  requests: [],
  selectedRequestId: null,
  requestTotal: 0,
  isLoadingRequests: false,
  pinnedSessionId: readPinnedSession(),

  fetchSessions: async () => {
    const result = await window.api.session.list()
    set({ sessions: result.sessions })
  },

  setActiveViewSession: (id) => {
    set({ activeViewSessionId: id, requests: [], selectedRequestId: null })
  },

  fetchRequests: async (params = {}) => {
    const { activeViewSessionId } = get()
    if (!activeViewSessionId) return

    set({ isLoadingRequests: true })
    const result = await window.api.request.list({
      sessionId: activeViewSessionId,
      ...params
    })
    set({
      requests: result.requests,
      requestTotal: result.total,
      isLoadingRequests: false
    })
  },

  appendRequest: (request) => {
    const { activeViewSessionId, requests } = get()
    if (request.sessionId !== activeViewSessionId) return
    set({ requests: [request, ...requests] })
  },

  setSelectedRequest: (id) => set({ selectedRequestId: id }),

  deleteSession: async (id) => {
    await window.api.session.delete({ sessionId: id })
    await get().fetchSessions()
    if (get().activeViewSessionId === id) {
      set({ activeViewSessionId: null, requests: [] })
    }
    // Clear pin if the pinned session is deleted
    if (get().pinnedSessionId === id) {
      writePinnedSession(null)
      set({ pinnedSessionId: null })
    }
  },

  mergeSessions: async (sourceId, targetId) => {
    await window.api.session.merge({ sourceSessionId: sourceId, targetSessionId: targetId })
    await get().fetchSessions()
    if (get().activeViewSessionId === sourceId) {
      set({ activeViewSessionId: targetId })
      await get().fetchRequests()
    }
  },

  clearSession: async (sessionId) => {
    await window.api.request.clear({ sessionId })
    if (get().activeViewSessionId === sessionId) {
      set({ requests: [], requestTotal: 0 })
    }
    await get().fetchSessions()
  },

  setPinnedSession: (id) => {
    writePinnedSession(id)
    set({ pinnedSessionId: id })
  },

  deleteFiltered: async (params) => {
    const result = await window.api.request.deleteFiltered(params)
    // Refresh request count in sessions list
    await get().fetchSessions()
    return result
  },
}))
