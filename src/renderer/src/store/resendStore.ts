import { create } from 'zustand'
import type { HttpRequest } from '@shared/types'
import type { IpcRequestResendResult } from '@shared/ipc-contracts'

export interface ResendTab {
  id: string
  title: string
  method: string
  url: string
  headers: Record<string, string>
  body: string
  // Response state
  response: IpcRequestResendResult | null
  sending: boolean
  error: string | null
}

function makeId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function tabTitle(method: string, url: string): string {
  try {
    const u = new URL(url)
    return `${method} ${u.pathname}`
  } catch {
    return `${method} ${url.slice(0, 40)}`
  }
}

interface ResendState {
  tabs: ResendTab[]
  activeTabId: string | null
  // Actions
  addTab: (request: HttpRequest, requestBody?: string | null) => string
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTab: (id: string, patch: Partial<Omit<ResendTab, 'id'>>) => void
  setSending: (id: string, sending: boolean) => void
  setResponse: (id: string, response: IpcRequestResendResult | null, error?: string | null) => void
}

export const useResendStore = create<ResendState>((set) => ({
  tabs: [],
  activeTabId: null,

  addTab: (request, requestBody) => {
    const id = makeId()
    const headers: Record<string, string> = {}
    for (const [k, v] of Object.entries(request.requestHeaders ?? {})) {
      headers[k] = String(v)
    }
    const tab: ResendTab = {
      id,
      title: tabTitle(request.method, request.url),
      method: request.method,
      url: request.url,
      headers,
      body: requestBody ?? '',
      response: null,
      sending: false,
      error: null,
    }
    set((s) => ({ tabs: [...s.tabs, tab], activeTabId: id }))
    return id
  },

  closeTab: (id) => {
    set((s) => {
      const tabs = s.tabs.filter((t) => t.id !== id)
      let activeTabId = s.activeTabId
      if (activeTabId === id) {
        const idx = s.tabs.findIndex((t) => t.id === id)
        const next = tabs[idx - 1] ?? tabs[tabs.length - 1]
        activeTabId = next?.id ?? null
      }
      return { tabs, activeTabId }
    })
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTab: (id, patch) => {
    set((s) => ({
      tabs: s.tabs.map((t) => {
        if (t.id !== id) return t
        const updated = { ...t, ...patch }
        if (patch.method !== undefined || patch.url !== undefined) {
          updated.title = tabTitle(updated.method, updated.url)
        }
        return updated
      }),
    }))
  },

  setSending: (id, sending) => {
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, sending } : t)),
    }))
  },

  setResponse: (id, response, error) => {
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id ? { ...t, response, error: error ?? null, sending: false } : t
      ),
    }))
  },
}))
