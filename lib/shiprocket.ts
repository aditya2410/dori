// Shiprocket integration.
//
// Currently used for one thing: checking COD serviceability of a delivery pincode
// at checkout. Order creation / AWB assignment are done MANUALLY in the Shiprocket
// panel for now, so there is no order-create call here yet.
//
// Auth: POST /v1/external/auth/login with { email, password } → { token } (valid
// ~10 days; cached in-memory below). Credentials come from a dedicated API user
// (Settings → API → Create an API User; the API user's email must differ from your
// account login email). Env: SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD,
// SHIPROCKET_PICKUP_PINCODE. These are server-only secrets — never NEXT_PUBLIC_.

const SHIPROCKET_BASE = 'https://apiv2.shiprocket.in/v1/external'

// Products don't carry a weight, so the serviceability query uses a default.
const DEFAULT_PARCEL_WEIGHT_KG = 1

// Cached bearer token. The login token lasts ~10 days; we cache for 9 to be safe.
let cachedToken: { token: string; expiresAt: number } | null = null

async function getToken(): Promise<string | null> {
  const email = process.env.SHIPROCKET_EMAIL
  const password = process.env.SHIPROCKET_PASSWORD
  if (!email || !password) return null // not configured

  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token

  try {
    const res = await fetch(`${SHIPROCKET_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      console.error('[shiprocket] auth failed:', res.status)
      return null
    }
    const json = (await res.json()) as { token?: string }
    if (!json.token) {
      console.error('[shiprocket] auth returned no token')
      return null
    }
    cachedToken = { token: json.token, expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000 }
    return json.token
  } catch (err) {
    console.error('[shiprocket] auth error:', err)
    return null
  }
}

/**
 * Whether a destination pincode is COD-serviceable, via Shiprocket's courier
 * serviceability API (any COD-capable courier counts — the actual courier, e.g.
 * DTDC, is chosen manually at fulfilment time).
 *
 * Fail-open policy: if Shiprocket isn't configured yet, or the API errors/times
 * out, we ALLOW COD rather than block a sale on a transient issue. Flip the two
 * `return true` fallbacks to `false` if you'd rather fail closed (force prepaid).
 */
export async function checkCodServiceability(deliveryPincode: string): Promise<boolean> {
  if (!/^\d{6}$/.test(deliveryPincode)) return false

  const pickup = process.env.SHIPROCKET_PICKUP_PINCODE
  const hasCreds = !!(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD)
  const token = await getToken()

  // No usable token → don't block checkout. Distinguish "auth failing" (creds set
  // but rejected) from "not configured", so the logs point at the real problem.
  if (!token || !pickup) {
    console.warn(
      hasCreds && !token
        ? '[shiprocket] serviceability skipped — creds set but auth failed (see 403 above); allowing COD'
        : '[shiprocket] serviceability skipped — not configured; allowing COD',
    )
    return true
  }

  try {
    const url = new URL(`${SHIPROCKET_BASE}/courier/serviceability/`)
    url.searchParams.set('pickup_postcode', pickup)
    url.searchParams.set('delivery_postcode', deliveryPincode)
    url.searchParams.set('cod', '1')
    url.searchParams.set('weight', String(DEFAULT_PARCEL_WEIGHT_KG))

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) {
      console.error('[shiprocket] serviceability failed:', res.status)
      return true // fail open on API error
    }
    const json = (await res.json()) as {
      data?: { available_courier_companies?: unknown[] }
    }
    const couriers = json?.data?.available_courier_companies
    // With cod=1, a non-empty courier list means at least one COD courier serves
    // this route.
    return Array.isArray(couriers) && couriers.length > 0
  } catch (err) {
    console.error('[shiprocket] serviceability error:', err)
    return true // fail open on network error
  }
}
