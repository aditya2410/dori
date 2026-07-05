import { NextRequest, NextResponse } from 'next/server'
import { sendCapiEvent, type CapiEvent } from '@/lib/meta'

// Server-side Conversions API relay. The browser calls this alongside the Pixel
// event (same event_id) so Meta receives both and dedupes. Reads the _fbp/_fbc
// cookies + IP + UA that improve match quality.
export async function POST(request: NextRequest) {
  let body: {
    eventName?: string
    eventId?: string
    eventSourceUrl?: string
    customData?: Record<string, unknown>
    userData?: CapiEvent['userData']
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  if (!body.eventName || !body.eventId) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const fbp = request.cookies.get('_fbp')?.value
  const fbc = request.cookies.get('_fbc')?.value
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || undefined
  const userAgent = request.headers.get('user-agent') || undefined

  await sendCapiEvent({
    eventName: body.eventName,
    eventId: body.eventId,
    eventSourceUrl: body.eventSourceUrl,
    customData: body.customData,
    userData: { ...(body.userData ?? {}), fbp, fbc, ip, userAgent },
  })

  return NextResponse.json({ ok: true })
}
