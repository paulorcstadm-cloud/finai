import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * useState that persists the value in localStorage.
 *
 * - State starts as `initialValue` on first render (SSR-safe, no hydration mismatch).
 * - After mount, reads from localStorage and updates state if data exists.
 * - Writes to localStorage synchronously inside setValue so data is never lost.
 * - When `key` changes (e.g. user switches), resets to initialValue if nothing is stored for the new key.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  // Keep a stable ref to the initial value so we can use it in effects without deps
  const initialValueRef = useRef(initialValue)

  // Read from localStorage after the first client mount (or when key changes)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T)
      } else {
        // Key changed and nothing stored for it — reset to the initial value
        setStoredValue(initialValueRef.current)
      }
    } catch {
      // parse error — keep initialValue
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value
        // Sync to localStorage immediately (inside the state updater for consistency)
        try {
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch {
          // quota exceeded or private-mode — silently ignore
        }
        return next
      })
    },
    [key]
  )

  return [storedValue, setValue] as const
}
