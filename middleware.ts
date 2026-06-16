import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse, after } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import type { Database } from '@/types/database.types'

// Module-level client — Edge runtime reuses the module across requests
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

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

function insertVisitorLog(fields: Database['public']['Tables']['visitor_logs']['Insert']) {
  after(async () => {
    const { error } = await supabaseAdmin.from('visitor_logs').insert(fields)
    if (error) console.error('visitor_log insert failed:', error.message)
  })
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const userAgent = request.headers.get('user-agent') ?? ''

  // Skip static assets, API routes, and bots — no session refresh needed
  if (SKIP_PATHS.some((p) => pathname.startsWith(p) || pathname.endsWith(p)))
    return NextResponse.next()
  if (BOT_PATTERNS.test(userAgent))
    return NextResponse.next()

  // Count one row per real visit: full page loads (Sec-Fetch-Dest: document)
  // and client-side App Router navigations (RSC fetches), but NOT prefetches.
  // Prefetches are marked by the browser's Sec-Purpose: prefetch header and/or
  // Next's Next-Router-Prefetch header — exclude anything carrying either.
  const isPrefetch =
    request.headers.get('sec-purpose')?.includes('prefetch') ||
    request.headers.has('next-router-prefetch')
  const isDocumentLoad = request.headers.get('sec-fetch-dest') === 'document'
  const isClientNav = request.headers.has('rsc')
  const shouldLog = !isPrefetch && (isDocumentLoad || isClientNav)

  const start = Date.now()
  const requestId = newRequestId()
  const ip = request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? null
  const country = request.headers.get('x-vercel-ip-country')
  const city = request.headers.get('x-vercel-ip-city')

  // Supabase PKCE email confirmation sends the code to SITE_URL (root).
  // Forward it to /callback so the route handler can exchange it for a session.
  if (pathname === '/' && searchParams.has('code')) {
    const callbackUrl = request.nextUrl.clone()
    callbackUrl.pathname = '/callback'
    const response = NextResponse.redirect(callbackUrl)
    response.headers.set('x-request-id', requestId)
    log({ requestId, method: request.method, pathname, outcome: 'redirect:callback', ms: Date.now() - start })
    if (shouldLog) insertVisitorLog({ request_id: requestId, ip, country, city, pathname, user_agent: userAgent, user_id: null })
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
    if (shouldLog) insertVisitorLog({ request_id: requestId, ip, country, city, pathname, user_agent: userAgent, user_id: null })
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
  if (shouldLog) insertVisitorLog({ request_id: requestId, ip, country, city, pathname, user_agent: userAgent, user_id: user?.id ?? null })
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
