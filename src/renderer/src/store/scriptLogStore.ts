import { create } from 'zustand'

export type ScriptLogLevel = 'debug' | 'info' | 'warn' | 'error' | 'alert'

export interface ScriptLogEntry {
  id: number
  script: string
  level: ScriptLogLevel
  message: string
  timestamp: number
}

interface ScriptLogState {
  logs: ScriptLogEntry[]
  // Which script name is selected for filtering — null = show all
  filterScript: string | null
  // Panel open/closed
  open: boolean
  appendLog: (entry: Omit<ScriptLogEntry, 'id'>) => void
  clearLogs: () => void
  setFilterScript: (name: string | null) => void
  setOpen: (open: boolean) => void
  toggleOpen: () => void
}

const MAX_LOGS = 500
let _nextId = 1

export const useScriptLogStore = create<ScriptLogState>((set) => ({
  logs: [],
  filterScript: null,
  open: false,

  appendLog: (entry) =>
    set((s) => {
      const newLogs = [...s.logs, { ...entry, id: _nextId++ }]
      // Auto-open panel on first error/warn
      const shouldOpen = !s.open && (entry.level === 'error' || entry.level === 'warn')
      return {
        logs: newLogs.length > MAX_LOGS ? newLogs.slice(newLogs.length - MAX_LOGS) : newLogs,
        open: shouldOpen ? true : s.open,
      }
    }),

  clearLogs: () => set({ logs: [] }),

  setFilterScript: (name) => set({ filterScript: name }),

  setOpen: (open) => set({ open }),

  toggleOpen: () => set((s) => ({ open: !s.open })),
}))
