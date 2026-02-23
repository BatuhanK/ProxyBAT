import { create } from 'zustand'
import type { ProxyStatus } from '@shared/types'

interface ProxyStartOptions {
  sessionId?: string
  sessionName?: string
}

interface ProxyState {
  status: ProxyStatus
  port: number | null
  activeSessionId: string | null
  showStartModal: boolean
  errorMessage: string | null

  setStatus: (status: ProxyStatus) => void
  setPort: (port: number | null) => void
  setActiveSessionId: (id: string | null) => void
  setErrorMessage: (message: string | null) => void
  openStartModal: () => void
  closeStartModal: () => void
  clearError: () => void
  startProxy: (opts?: ProxyStartOptions) => Promise<void>
  stopProxy: () => Promise<void>
  fetchStatus: () => Promise<void>
}

export const useProxyStore = create<ProxyState>((set, get) => ({
  status: 'stopped',
  port: null,
  activeSessionId: null,
  showStartModal: false,
  errorMessage: null,

  setStatus: (status) => set({ status }),
  setPort: (port) => set({ port }),
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  setErrorMessage: (message) => set({ errorMessage: message }),
  openStartModal: () => set({ showStartModal: true, errorMessage: null }),
  closeStartModal: () => set({ showStartModal: false, errorMessage: null }),
  clearError: () => set({ errorMessage: null }),

  startProxy: async (opts?: ProxyStartOptions) => {
    set({ status: 'starting', errorMessage: null })
    const result = await window.api.proxy.start({
      sessionId: opts?.sessionId,
      sessionName: opts?.sessionName,
    })
    if (result.success) {
      set({ status: 'running', port: result.port ?? null, showStartModal: false, errorMessage: null })
      // Fetch full status to get the activeSessionId from main
      await get().fetchStatus()
    } else {
      set({ status: 'error', errorMessage: result.error || 'Failed to start proxy' })
      console.error('Failed to start proxy:', result.error)
    }
  },

  stopProxy: async () => {
    const { activeSessionId } = get()
    if (activeSessionId) {
      await window.api.proxy.stop({ sessionId: activeSessionId })
    }
    set({ status: 'stopped', port: null, activeSessionId: null })
  },

  fetchStatus: async () => {
    const result = await window.api.proxy.getStatus()
    set({
      status: result.status,
      port: result.port,
      activeSessionId: result.activeSessionId
    })
  }
}))
