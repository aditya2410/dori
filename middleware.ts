import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const SKIP_PATHS = [
  '/_next', '/api', '/favicon', '/robots.txt', '/sitemap',
  '.png', '.jpg', '.webp', '.svg', '.ico', '.css', '.js',
]

const BOT_PATTERNS = /bot|crawler|spider|curl|postman|python|axios/i

const PROTECTED_PREFIXES = ['/checkout', '/account']
const ADMIN_PREFIX = '/admin'

function newRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function log(fields: Record<string, unknown>) {
  console.log(JSON.stringify(fields))
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const userAgent = request.headers.get('user-agent') ?? ''

  // Skip static assets, API routes, and bots — no session refresh needed
  if (SKIP_PATHS.some((p) => pathname.startsWith(p) || pathname.endsWith(p)))
    return NextResponse.next()
  if (BOT_PATTERNS.test(userAgent))
    return NextResponse.next()

  const start = Date.now()
  const requestId = newRequestId()

  // Supabase PKCE email confirmation sends the code to SITE_URL (root).
  // Forward it to /callback so the route handler can exchange it for a session.
  if (pathname === '/' && searchParams.has('code')) {
    const callbackUrl = request.nextUrl.clone()
    callbackUrl.pathname = '/callback'
    const response = NextResponse.redirect(callbackUrl)
    response.headers.set('x-request-id', requestId)
    log({ requestId, method: request.method, pathname, outcome: 'redirect:callback', ms: Date.now() - start })
    return response
  }

  const { supabaseResponse, user } = await updateSession(request)

  const needsAuth =
    PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith(ADMIN_PREFIX)

  if (needsAuth && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    if (pathname !== '/admin') loginUrl.searchParams.set('next', pathname)
    const response = NextResponse.redirect(loginUrl)
    response.headers.set('x-request-id', requestId)
    log({ requestId, method: request.method, pathname, outcome: 'redirect:login', ms: Date.now() - start })
    return response
  }

  supabaseResponse.headers.set('x-request-id', requestId)
  log({
    requestId,
    method: request.method,
    pathname,
    userId: user?.id ?? null,
    outcome: 'next',
    ms: Date.now() - start,
  })
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
