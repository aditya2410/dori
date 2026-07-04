// Cash-on-Delivery configuration — the single source of truth for both the
// checkout UI (client) and the order API (server). Tune via env vars in the
// Vercel dashboard (no redeploy of code needed). The NEXT_PUBLIC_ prefix is
// required because the checkout UI reads these client-side; the values are not
// secret, and the server still re-reads + enforces the cap authoritatively.

// Parse a paise amount from env; fall back if unset/invalid. Values are inlined
// at build time for NEXT_PUBLIC_ vars, so reference them directly (not dynamically).
function paiseFromEnv(raw: string | undefined, fallback: number): number {
  const n = Number(raw)
  return Number.isInteger(n) && n >= 0 ? n : fallback
}

// Maximum order value (in paise) eligible for COD. Orders above this show
// "Pay Online" only. Default ₹5,000.
export const COD_MAX_PAISE = paiseFromEnv(process.env.NEXT_PUBLIC_COD_MAX_PAISE, 500_000)

// Optional COD handling fee (in paise), added as a SEPARATE line item — never
// folded into product prices. Set to 0 to disable (no fee, no line item shown).
// Default 0.
export const COD_FEE_PAISE = paiseFromEnv(process.env.NEXT_PUBLIC_COD_FEE_PAISE, 0)

// The COD cap is evaluated against the order value BEFORE the COD fee
// (goods − discount + shipping). The fee is a consequence of choosing COD, so it
// must not push an otherwise-eligible order over the cap.
export function isCodEligible(preFeeTotalPaise: number): boolean {
  return preFeeTotalPaise <= COD_MAX_PAISE
}

// The COD fee actually applied for a given payment method.
export function codFeeFor(paymentMethod: 'razorpay' | 'cod'): number {
  return paymentMethod === 'cod' ? COD_FEE_PAISE : 0
}
