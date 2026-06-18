import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { computeSaleDiscount } from '@/lib/sales'

const bodySchema = z.object({
  code: z.string().min(1),
  items: z
    .array(z.object({ productId: z.string().uuid(), quantity: z.number().int().positive() }))
    .min(1, 'Cart is empty'),
})

// Checkout preview: validate a code and return the discount. The authoritative
// re-check happens again at order creation, so this is safe to expose.
export async function POST(request: NextRequest) {
  // Session optional — guests preview codes too. The per-user limit is enforced
  // authoritatively at order creation once the account is resolved by email.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { code, items } = parsed.data
  const service = createServiceClient()

  // Recompute subtotal from DB prices.
  const productIds = items.map((i) => i.productId)
  const { data: products } = await service
    .from('products')
    .select('id, price_paise, is_active')
    .in('id', productIds)
  if (!products || products.length !== productIds.length) {
    return NextResponse.json({ error: 'One or more products not found' }, { status: 400 })
  }
  const priceMap = new Map(products.map((p) => [p.id, p]))
  const subtotalPaise = items.reduce((s, i) => s + (priceMap.get(i.productId)?.price_paise ?? 0) * i.quantity, 0)

  const result = await computeSaleDiscount(service, code, user?.id ?? null, subtotalPaise)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })

  return NextResponse.json({
    code: result.code,
    discountPercent: result.discountPercent,
    discountPaise: result.discountPaise,
    freeShipping: result.freeShipping,
  })
}
