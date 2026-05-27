import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Auth callback — handles:
 *  - Email verification (type=signup)
 *  - Password recovery (type=recovery)
 *  - Magic link (type=magiclink)
 *
 * Supabase redirects here after the user clicks the link in the email.
 * We exchange the code for a session and redirect to the appropriate page.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Supabase error in the URL (e.g. expired link)
  if (error) {
    const url = new URL('/login', origin)
    url.searchParams.set('error', errorDescription ?? error)
    return NextResponse.redirect(url)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      // Password recovery → go to reset password page
      if (next.startsWith('/reset-password')) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      // All other flows (email verification, magic link) → dashboard
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Fallback — something went wrong
  return NextResponse.redirect(`${origin}/login?error=Link inválido ou expirado`)
}
