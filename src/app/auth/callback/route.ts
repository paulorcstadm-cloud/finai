import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Auth callback — handles:
 *  - Email verification  (type=signup  | next defaults to /dashboard)
 *  - Password recovery   (type=recovery | next=/reset-password)
 *  - Magic link          (type=magiclink)
 *
 * Supabase redirects here after the user clicks the link in the email.
 * We exchange the PKCE code for a session and redirect to the right page.
 *
 * URL formats received:
 *   /auth/callback?code=CODE&type=recovery
 *   /auth/callback?code=CODE&next=/reset-password
 *   /auth/callback?error=...&error_description=...
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const code             = searchParams.get('code')
  const type             = searchParams.get('type')             // 'recovery' | 'signup' | 'magiclink'
  const next             = searchParams.get('next') ?? '/dashboard'
  const error            = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // ── Supabase returned an error in the URL (e.g. expired link) ──────────────
  if (error) {
    const url = new URL('/login', origin)
    url.searchParams.set('error', errorDescription ?? error)
    return NextResponse.redirect(url)
  }

  // ── Exchange PKCE code for session ─────────────────────────────────────────
  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      // Code is invalid or expired
      return NextResponse.redirect(
        `${origin}/login?error=Link inválido ou expirado. Solicite um novo.`
      )
    }

    // ── Determine destination ────────────────────────────────────────────────
    // Priority: explicit `type=recovery` > `next` param containing reset-password > default dashboard
    const isRecovery =
      type === 'recovery' ||
      next.startsWith('/reset-password') ||
      next.includes('reset-password')

    if (isRecovery) {
      return NextResponse.redirect(`${origin}/reset-password`)
    }

    // Default: email verification, magic link, etc. → dashboard
    if (next && next !== '/dashboard' && next.startsWith('/')) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    return NextResponse.redirect(`${origin}/dashboard`)
  }

  // ── No code and no error — fallback ───────────────────────────────────────
  return NextResponse.redirect(`${origin}/login?error=Link inválido ou expirado.`)
}
