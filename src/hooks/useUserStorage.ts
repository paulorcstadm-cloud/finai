'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useLocalStorage } from './useLocalStorage'

/**
 * Like useLocalStorage but automatically prefixes the key with the current user's id.
 * Data is isolated per user. Falls back to 'paulo' if no user is set.
 */
export function useUserStorage<T>(key: string, initialValue: T) {
  const { user } = useAuth()
  const prefixedKey = `${user?.id ?? 'paulo'}_${key}`
  return useLocalStorage<T>(prefixedKey, initialValue)
}
