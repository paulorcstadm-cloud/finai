import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware — runs on every matching request.
 * Responsibilities:
 *  1. Refresh the Supabase session (JWT) on every request.
 *  2. Redirect unauthenticated users away from protected routes.
 *  3. Redirect authenticated users away from auth pages.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — do NOT remove this
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes (auth pages)
  const authPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/auth']
  const isAuthPath = authPaths.some(p => pathname.startsWith(p))

  // If not logged in and trying to access a protected route → login
  if (!user && !isAuthPath && pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If logged in and trying to access auth pages → dashboard
  if (user && isAuthPath && !pathname.startsWith('/auth/callback')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - API routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
