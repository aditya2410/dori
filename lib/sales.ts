import type { createServiceClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'

type Service = ReturnType<typeof createServiceClient>

export type DiscountResult =
  | { ok: true; saleId: string; code: string; discountPercent: number; discountPaise: number; freeShipping: boolean }
  | { ok: false; error: string }

/**
 * Validate a sale code for a given user + subtotal and compute the rupees off.
 * Authoritative — used both by the checkout preview endpoint and at order
 * creation. Never trusts a client-supplied discount amount.
 *
 * "Once per user" and total usage are derived from non-cancelled orders, so a
 * cancelled/abandoned order frees the code automatically.
 */
export async function computeSaleDiscount(
  service: Service,
  rawCode: string,
  userId: string | null,
  subtotalPaise: number,
): Promise<DiscountResult> {
  const code = rawCode.trim()
  if (!code) return { ok: false, error: 'Enter a code.' }

  // ilike with no wildcards = case-insensitive exact match (codes are alphanumeric).
  const { data: sale } = await service
    .from('sales')
    .select('*')
    .ilike('code', code)
    .maybeSingle()

  if (!sale) return { ok: false, error: 'Invalid code.' }
  if (!sale.is_active) return { ok: false, error: 'This code is no longer active.' }

  const now = Date.now()
  if (new Date(sale.starts_at).getTime() > now) return { ok: false, error: 'This code is not active yet.' }
  if (new Date(sale.ends_at).getTime() < now) return { ok: false, error: 'This code has expired.' }

  if (sale.min_order_paise && subtotalPaise < sale.min_order_paise) {
    return { ok: false, error: `Add ${formatPrice(sale.min_order_paise)} of items to use this code.` }
  }

  // Total usage cap across all customers.
  if (sale.usage_limit != null) {
    const { count } = await service
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('sale_id', sale.id)
      .neq('status', 'cancelled')
    if ((count ?? 0) >= sale.usage_limit) {
      return { ok: false, error: 'This code has reached its usage limit.' }
    }
  }

  // Once per user. Guests previewing a code at checkout have no account yet
  // (userId null) — this is re-checked authoritatively at order creation once
  // the account is resolved by email.
  if (userId) {
    const { count: userCount } = await service
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('sale_id', sale.id)
      .eq('user_id', userId)
      .neq('status', 'cancelled')
    if ((userCount ?? 0) > 0) {
      return { ok: false, error: 'You have already used this code.' }
    }
  }

  let discountPaise = Math.floor((subtotalPaise * sale.discount_percent) / 100)
  if (sale.max_discount_paise != null) discountPaise = Math.min(discountPaise, sale.max_discount_paise)
  discountPaise = Math.min(discountPaise, subtotalPaise)

  if (discountPaise <= 0) return { ok: false, error: 'This code gives no discount on your order.' }

  // Free shipping has its own cap, independent of usage_limit. Orders that got
  // free shipping have shipping_paise = 0; once the limit is hit, later orders
  // still get the discount but pay shipping.
  let freeShipping = sale.free_shipping
  if (freeShipping && sale.free_shipping_limit != null) {
    const { count } = await service
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('sale_id', sale.id)
      .neq('status', 'cancelled')
      .eq('shipping_paise', 0)
    if ((count ?? 0) >= sale.free_shipping_limit) freeShipping = false
  }

  return {
    ok: true,
    saleId: sale.id,
    code: sale.code,
    discountPercent: sale.discount_percent,
    discountPaise,
    freeShipping,
  }
}
