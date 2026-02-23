import { useState, useCallback } from 'react'

/**
 * Persists state to localStorage. Works just like useState but reads/writes
 * from localStorage on mount and on every update.
 *
 * @param key        localStorage key (should be globally unique in the app)
 * @param defaultValue  used when the key is not found or value cannot be parsed
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setStateRaw] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return defaultValue
      return JSON.parse(raw) as T
    } catch {
      return defaultValue
    }
  })

  const setState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStateRaw((prev) => {
        const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value
        try {
          localStorage.setItem(key, JSON.stringify(next))
        } catch {
          // localStorage unavailable (private mode, storage quota, etc.) — still update state
        }
        return next
      })
    },
    [key]
  )

  return [state, setState]
}
