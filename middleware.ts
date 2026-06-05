import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

function newRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

const PROTECTED_PREFIXES = ['/checkout', '/account']
const ADMIN_PREFIX = '/admin'

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Supabase PKCE email confirmation sends the code to SITE_URL (root).
  // Forward it to /callback so the route handler can exchange it for a session.
  if (pathname === '/' && searchParams.has('code')) {
    const callbackUrl = request.nextUrl.clone()
    callbackUrl.pathname = '/callback'
    return NextResponse.redirect(callbackUrl)
  }

  const { supabaseResponse, user } = await updateSession(request)

  const needsAuth =
    PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith(ADMIN_PREFIX)

  if (needsAuth && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    // Preserve destination so we can redirect back after login
    if (pathname !== '/admin') loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Stamp every response with a unique request ID for log correlation
  supabaseResponse.headers.set('x-request-id', newRequestId())
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files and images.
     * This ensures the session cookie is refreshed on every navigation.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
