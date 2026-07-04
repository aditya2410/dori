import crypto from 'crypto'

// Meta (Facebook/Instagram) Pixel + Conversions API. Everything no-ops unless the
// env vars are set, so the app runs fine without Meta configured.
//   NEXT_PUBLIC_META_PIXEL_ID   — Pixel ID (client + server)
//   META_CAPI_ACCESS_TOKEN      — Conversions API token (server only)
//   META_CAPI_TEST_EVENT_CODE   — optional, for Meta's Test Events tab
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || ''
const CAPI_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || ''
const TEST_CODE = process.env.META_CAPI_TEST_EVENT_CODE || ''
const GRAPH_VERSION = 'v21.0'

function sha256(value?: string | null): string | undefined {
  if (!value) return undefined
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

export interface CapiEvent {
  eventName: string
  eventId: string
  eventSourceUrl?: string
  customData?: Record<string, unknown>
  userData?: {
    email?: string
    phone?: string
    fbp?: string
    fbc?: string
    ip?: string
    userAgent?: string
  }
}

/**
 * Send a server-side Conversions API event. Uses the same event_id as the
 * browser Pixel event so Meta deduplicates the pair. Fails silently.
 */
export async function sendCapiEvent(ev: CapiEvent): Promise<void> {
  if (!META_PIXEL_ID || !CAPI_TOKEN) return

  const userData: Record<string, unknown> = {}
  const em = sha256(ev.userData?.email)
  const ph = sha256(ev.userData?.phone?.replace(/[^0-9]/g, ''))
  if (em) userData.em = em
  if (ph) userData.ph = ph
  if (ev.userData?.fbp) userData.fbp = ev.userData.fbp
  if (ev.userData?.fbc) userData.fbc = ev.userData.fbc
  if (ev.userData?.ip) userData.client_ip_address = ev.userData.ip
  if (ev.userData?.userAgent) userData.client_user_agent = ev.userData.userAgent

  const payload = {
    data: [
      {
        event_name: ev.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: ev.eventId,
        action_source: 'website',
        event_source_url: ev.eventSourceUrl,
        user_data: userData,
        custom_data: ev.customData ?? {},
      },
    ],
    ...(TEST_CODE ? { test_event_code: TEST_CODE } : {}),
  }

  try {
    await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${META_PIXEL_ID}/events?access_token=${CAPI_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    )
  } catch (err) {
    console.error('[meta capi]', err)
  }
}
