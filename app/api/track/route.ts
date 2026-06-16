import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const requestId = request.headers.get('x-request-id') ?? 'unknown'

    // Structured log — captured by Vercel's log drain / Vercel Observability
    console.log(JSON.stringify({
      type: 'track',
      requestId,
      sessionId: body.sessionId ?? null,
      event:     body.event,
      path:      body.path,
      meta:      body.meta ?? {},
      timestamp: new Date().toISOString(),
    }))

    // Persist page views to visitor_logs here (not middleware): the App Router
    // serves prefetched navigations from the client cache, so those clicks never
    // reach the server. AnalyticsProvider fires page_view once per real route
    // change, which is the only reliable signal for a visit.
    if (body.event === 'page_view' && typeof body.path === 'string') {
      const ip =
        request.headers.get('x-real-ip') ??
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
        null
      const country = request.headers.get('x-vercel-ip-country')
      const city = request.headers.get('x-vercel-ip-city')
      const userAgent = request.headers.get('user-agent') ?? ''

      const supabase = await createClient()
      const { data } = await supabase.auth.getUser()

      const admin = createServiceClient()
      const { error } = await admin.from('visitor_logs').insert({
        ip,
        country,
        city,
        pathname:   body.path,
        user_agent: userAgent,
        user_id:    data.user?.id ?? null,
      })
      if (error) console.error('visitor_log insert failed:', error.message)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
