import { NextRequest, NextResponse } from 'next/server'

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

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
