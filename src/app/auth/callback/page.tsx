'use client'

/**
 * Auth Callback Page — client-side handler for Supabase auth redirects.
 *
 * Why client-side?
 *   Supabase can return tokens in TWO ways:
 *   1. PKCE flow  → ?code=CODE in the query string (readable server-side)
 *   2. Implicit flow → #access_token=... in the hash fragment (hash is NEVER sent
 *      to the server — only readable by client-side JS)
 *
 *   A server-side route.ts only sees query params, so implicit-flow tokens are
 *   invisible to it, causing "Link inválido ou expirado" every time.
 *   This client page handles BOTH flows correctly.
 *
 * Flow types handled:
 *   - Email verification  (type=signup)  → /dashboard
 *   - Password recovery   (type=recovery) → /reset-password
 *   - Magic link          (type=magiclink) → /dashboard
 */

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles } from 'lucide-react'

// ── Inner component (needs Suspense because it uses useSearchParams) ──────────

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()

    ;(async () => {
      // ── Read URL parameters ────────────────────────────────────────────────
      const code             = searchParams.get('code')
      const next             = searchParams.get('next') ?? '/dashboard'
      const type             = searchParams.get('type')   // 'recovery' | 'signup' | null
      const error            = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      // Supabase sent an explicit error
      if (error) {
        const msg = errorDescription ?? error
        router.replace(`/login?error=${encodeURIComponent(msg)}`)
        return
      }

      // Helper: decide destination after successful auth
      const isRecovery = (hashType?: string | null) =>
        type === 'recovery' ||
        hashType === 'recovery' ||
        next.startsWith('/reset-password') ||
        next.includes('reset-password')

      // ── Path 1: Implicit flow — tokens in hash fragment ───────────────────
      // e.g. /auth/callback#access_token=XXX&refresh_token=YYY&type=recovery
      const hash = typeof window !== 'undefined' ? window.location.hash : ''
      if (hash && hash.length > 1) {
        const hashParams   = new URLSearchParams(hash.substring(1))
        const accessToken  = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const hashType     = hashParams.get('type')

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token:  accessToken,
            refresh_token: refreshToken,
          })

          if (!sessionError) {
            router.replace(isRecovery(hashType) ? '/reset-password' : '/dashboard')
            return
          }
          // session set failed → fall through to error
        }
      }

      // ── Path 2: PKCE flow — code in query string ──────────────────────────
      // e.g. /auth/callback?code=XXX&type=recovery&next=/reset-password
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (!exchangeError) {
          router.replace(isRecovery() ? '/reset-password' : '/dashboard')
          return
        }

        // Exchange failed (expired, wrong browser, already used, etc.)
        router.replace(`/login?error=${encodeURIComponent('Link inválido ou expirado. Solicite um novo.')}`)
        return
      }

      // ── Path 3: Neither code nor hash found ───────────────────────────────
      router.replace(`/login?error=${encodeURIComponent('Link inválido ou expirado.')}`)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Renders nothing — the spinner below is always visible
  return null
}

// ── Loading UI — shown while JS runs ─────────────────────────────────────────

function Spinner() {
  return (
    <div className="min-h-screen bg-[#09090F] flex flex-col items-center justify-center gap-5">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
        <Sparkles className="w-7 h-7 text-white" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="w-7 h-7 rounded-full border-2 border-primary-500/30 border-t-primary-500 animate-spin" />
        <p className="text-slate-500 text-xs">Verificando autenticação...</p>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuthCallbackPage() {
  return (
    <>
      <Spinner />
      {/* CallbackHandler must be inside Suspense because it uses useSearchParams */}
      <Suspense fallback={null}>
        <CallbackHandler />
      </Suspense>
    </>
  )
}
