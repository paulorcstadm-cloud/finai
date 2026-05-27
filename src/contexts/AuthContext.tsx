'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { USER_CONFIG, type UserId, type AuthUser } from '@/lib/users'

interface AuthCtx {
  user: AuthUser | null
  loading: boolean
  login: (id: string, password: string) => boolean
  logout: () => void
  changePassword: (currentPw: string, newPw: string) => boolean
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: () => false,
  logout: () => {},
  changePassword: () => false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('finai_current_user')
      if (stored) {
        const { id } = JSON.parse(stored) as { id: UserId }
        const cfg = USER_CONFIG[id]
        if (cfg) setUser(cfg)
      }
    } catch {}
    setLoading(false)
  }, [])

  /** Check custom password first (if user changed it), then fall back to default */
  const checkPassword = (id: string, password: string): boolean => {
    const cfg = USER_CONFIG[id as UserId]
    if (!cfg) return false
    try {
      const custom = localStorage.getItem(`${id}_custom_password`)
      const validPw = custom ?? cfg.password
      return password === validPw
    } catch {
      return password === cfg.password
    }
  }

  const login = useCallback((id: string, password: string): boolean => {
    const cfg = USER_CONFIG[id as UserId]
    if (!cfg) return false
    if (!checkPassword(id, password)) return false
    setUser(cfg)
    try { localStorage.setItem('finai_current_user', JSON.stringify({ id: cfg.id })) } catch {}
    return true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    try { localStorage.removeItem('finai_current_user') } catch {}
  }, [])

  const changePassword = useCallback((currentPw: string, newPw: string): boolean => {
    if (!user) return false
    if (!checkPassword(user.id, currentPw)) return false
    try {
      localStorage.setItem(`${user.id}_custom_password`, newPw)
      return true
    } catch {
      return false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
