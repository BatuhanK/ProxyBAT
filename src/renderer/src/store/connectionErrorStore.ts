import { create } from 'zustand'

export type ConnectionErrorType = 'ssl_error' | 'connection_refused' | 'timeout'

export interface ConnectionErrorEntry {
  id: number
  host: string
  reason: string
  errorType: ConnectionErrorType
  timestamp: number
  /** dismissed by user */
  dismissed: boolean
}

interface ConnectionErrorState {
  errors: ConnectionErrorEntry[]
  appendError: (entry: Omit<ConnectionErrorEntry, 'id' | 'dismissed'>) => void
  dismiss: (id: number) => void
  dismissAll: () => void
  clearAll: () => void
}

const MAX_ERRORS = 200
let _nextId = 1

export const useConnectionErrorStore = create<ConnectionErrorState>((set) => ({
  errors: [],

  appendError: (entry) =>
    set((s) => {
      // Deduplicate: if same host+errorType occurred in the last 5s, skip
      const now = entry.timestamp
      const isDuplicate = s.errors.some(
        (e) =>
          !e.dismissed &&
          e.host === entry.host &&
          e.errorType === entry.errorType &&
          now - e.timestamp < 5000,
      )
      if (isDuplicate) return s

      const newErrors = [...s.errors, { ...entry, id: _nextId++, dismissed: false }]
      return {
        errors:
          newErrors.length > MAX_ERRORS
            ? newErrors.slice(newErrors.length - MAX_ERRORS)
            : newErrors,
      }
    }),

  dismiss: (id) =>
    set((s) => ({
      errors: s.errors.map((e) => (e.id === id ? { ...e, dismissed: true } : e)),
    })),

  dismissAll: () =>
    set((s) => ({ errors: s.errors.map((e) => ({ ...e, dismissed: true })) })),

  clearAll: () => set({ errors: [] }),
}))
