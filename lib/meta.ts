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
  const norm = value.trim().toLowerCase()
  if (!norm) return undefined
  return crypto.createHash('sha256').update(norm).digest('hex')
}

// Digits only; assume India (+91) when a bare 10-digit number is given so Meta
// can match phone numbers stored in E.164-ish form.
function normalizePhone(value?: string): string | undefined {
  if (!value) return undefined
  let d = value.replace(/[^0-9]/g, '')
  if (d.length === 10) d = '91' + d
  return d || undefined
}

export interface CapiEvent {
  eventName: string
  eventId: string
  eventSourceUrl?: string
  customData?: Record<string, unknown>
  userData?: {
    email?: string
    phone?: string
    firstName?: string
    lastName?: string
    city?: string
    state?: string
    zip?: string
    country?: string
    externalId?: string
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

  const u = ev.userData ?? {}
  const userData: Record<string, unknown> = {}
  const set = (key: string, hashed?: string) => {
    if (hashed) userData[key] = hashed
  }
  set('em', sha256(u.email))
  set('ph', sha256(normalizePhone(u.phone)))
  set('fn', sha256(u.firstName))
  set('ln', sha256(u.lastName))
  set('ct', sha256(u.city?.replace(/\s+/g, '')))
  set('st', sha256(u.state?.replace(/\s+/g, '')))
  set('zp', sha256(u.zip?.replace(/\s+/g, '')))
  set('country', sha256(u.country))
  // external_id is an opaque, stable visitor id — sent raw so the browser Pixel
  // and CAPI values match; Meta normalises it.
  if (u.externalId) userData.external_id = u.externalId
  if (u.fbp) userData.fbp = u.fbp
  if (u.fbc) userData.fbc = u.fbc
  if (u.ip) userData.client_ip_address = u.ip
  if (u.userAgent) userData.client_user_agent = u.userAgent

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
