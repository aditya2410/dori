import { createServiceClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'

const DEFAULT_BG = '#1a1a1a'

// Pick black or white text depending on how light the background is.
function textColorFor(hex: string): string {
  const c = hex.replace('#', '')
  if (c.length !== 6) return '#ffffff'
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#1a1a1a' : '#ffffff'
}

// Scrolling announcement bar of currently-live sale codes. Renders nothing when
// no sale is active (is_active + within its date window).
export async function SaleBanner() {
  const nowIso = new Date().toISOString()
  const { data: sales } = await createServiceClient()
    .from('sales')
    .select('code, discount_percent, min_order_paise, description, banner_color')
    .eq('is_active', true)
    .lte('starts_at', nowIso)
    .gte('ends_at', nowIso)
    .order('created_at', { ascending: false })

  if (!sales?.length) return null

  const messages = sales.map((s) => {
    if (s.description?.trim()) return s.description.trim()
    const min = s.min_order_paise ? ` on orders over ${formatPrice(s.min_order_paise)}` : ''
    return `${s.discount_percent}% off with code ${s.code}${min}`
  })

  const bg = sales[0].banner_color ?? DEFAULT_BG
  const fg = textColorFor(bg)

  // Repeat the messages enough to overflow even wide screens, so the marquee
  // never leaves a gap. Estimate each item's rendered width (text + padding).
  const baseWidthPx = messages.reduce((n, m) => n + m.length * 8 + 80, 0)
  const reps = Math.max(2, Math.ceil(2400 / baseWidthPx))
  const copy = Array.from({ length: reps }).flatMap(() => messages)

  // One copy scrolls past in copyWidth / speed seconds. ~2x the previous pace.
  const copyWidthPx = reps * baseWidthPx
  const durationSec = Math.max(8, Math.round(copyWidthPx / 100))

  return (
    <div className="overflow-hidden" style={{ backgroundColor: bg, color: fg }}>
      {/* Two identical tracks; translating -50% loops seamlessly. */}
      <div
        className="flex w-max animate-marquee whitespace-nowrap will-change-transform motion-reduce:animate-none"
        style={{ animationDuration: `${durationSec}s` }}
      >
        {[0, 1].map((dup) => (
          <ul key={dup} className="flex items-center" aria-hidden={dup === 1}>
            {copy.map((message, i) => (
              <li key={i} className="flex items-center gap-6 px-6 py-2 text-[11px] tracking-[0.15em] uppercase">
                <span>{message}</span>
                <span className="opacity-40">•</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}
