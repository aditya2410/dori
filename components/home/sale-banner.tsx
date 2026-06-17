import { createServiceClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'

// Scrolling announcement bar of currently-live sale codes. Renders nothing when
// no sale is active (is_active + within its date window).
export async function SaleBanner() {
  const nowIso = new Date().toISOString()
  const { data: sales } = await createServiceClient()
    .from('sales')
    .select('code, discount_percent, min_order_paise')
    .eq('is_active', true)
    .lte('starts_at', nowIso)
    .gte('ends_at', nowIso)
    .order('created_at', { ascending: false })

  if (!sales?.length) return null

  const messages = sales.map((s) => {
    const min = s.min_order_paise ? ` on orders over ${formatPrice(s.min_order_paise)}` : ''
    return `${s.discount_percent}% off with code ${s.code}${min}`
  })

  return (
    <div className="bg-foreground text-background overflow-hidden">
      {/* Two identical tracks; translating -50% loops seamlessly. */}
      <div className="flex w-max animate-marquee whitespace-nowrap will-change-transform motion-reduce:animate-none">
        {[0, 1].map((dup) => (
          <ul key={dup} className="flex items-center" aria-hidden={dup === 1}>
            {messages.map((message, i) => (
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
