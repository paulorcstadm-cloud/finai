'use client'

import {
  createContext, useContext, useState, useEffect,
  useCallback, type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FinAIUser {
  id: string           // Supabase UUID — used as localStorage key prefix
  name: string
  fullName: string
  email: string
  avatar: string       // 2-letter initials
  color: string        // brand color for avatar
  score: number        // financial health score
  nav: string[]        // sidebar nav items
  quickPrompts: { label: string; prompt: string }[]
  cfoIntro: string
}

interface AuthCtx {
  user: FinAIUser | null
  loading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_NAV = [
  'dashboard', 'contas', 'faturas', 'contas-a-pagar',
  'metas', 'assinaturas', 'score', 'chat', 'documentos', 'alertas', 'perfil',
]

const DEFAULT_QUICK_PROMPTS = [
  { label: '📊 Resumo geral',   prompt: 'Me dê um resumo do meu estado financeiro atual' },
  { label: '✂️ Cortar gastos',  prompt: 'Onde posso cortar gastos esse mês?' },
  { label: '💰 Investir',       prompt: 'Onde devo investir o dinheiro parado?' },
  { label: '🎯 Minhas metas',   prompt: 'Como estou em relação às minhas metas financeiras?' },
  { label: '📈 Análise mensal', prompt: 'Analise meus gastos do mês atual detalhadamente' },
]

const AVATAR_COLORS = [
  '#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6',
  '#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899',
]

function buildFinAIUser(supaUser: User, profile: Record<string, unknown> | null): FinAIUser {
  const name = (profile?.name as string) || supaUser.user_metadata?.name || supaUser.email?.split('@')[0] || 'Usuário'
  const avatar = (profile?.avatar as string) || name.slice(0, 2).toUpperCase()
  const color = (profile?.color as string) || AVATAR_COLORS[Math.abs(supaUser.id.charCodeAt(0)) % AVATAR_COLORS.length]
  const score = (profile?.score as number) ?? 742

  return {
    id: supaUser.id,
    name: name.split(' ')[0],
    fullName: name,
    email: supaUser.email ?? '',
    avatar,
    color,
    score,
    nav: DEFAULT_NAV,
    quickPrompts: DEFAULT_QUICK_PROMPTS,
    cfoIntro: `Olá, **${name.split(' ')[0]}**! 👋 Sou o **CFO IA** — seu assistente financeiro pessoal.\n\nAdicione suas contas e lançamentos para que eu possa analisar seus dados e te dar insights personalizados.\n\nComo posso te ajudar hoje?`,
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const [user, setUser] = useState<FinAIUser | null>(null)
  const [loading, setLoading] = useState(true)

  /** Fetch profile from Supabase and build FinAIUser */
  const loadUser = useCallback(async (supaUser: User) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, avatar, color, score')
      .eq('id', supaUser.id)
      .single()

    setUser(buildFinAIUser(supaUser, profile as Record<string, unknown> | null))
  }, [supabase])

  /** Sync auth state on mount and when session changes */
  useEffect(() => {
    // Initial session check
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) loadUser(u).finally(() => setLoading(false))
      else { setUser(null); setLoading(false) }
    })

    // Listen to auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadUser(session.user)
      else setUser(null)
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [supabase])

  const refreshUser = useCallback(async () => {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (u) await loadUser(u)
  }, [supabase, loadUser])

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
