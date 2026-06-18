import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getRazorpay } from '@/lib/razorpay'
import { generateOrderNumber } from '@/lib/utils'
import { computeSaleDiscount } from '@/lib/sales'
import { getOrCreateUserByEmail } from '@/lib/auth'
import type { ShippingAddress, Json } from '@/types/database.types'

const guestSchema = z.object({
  email: z.string().email('Enter a valid email.'),
  full_name: z.string().min(1, 'Name is required.'),
  phone: z.string().min(1, 'Phone is required.'),
  line1: z.string().min(1, 'Address is required.'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required.'),
  state: z.string().min(1, 'State is required.'),
  pincode: z.string().min(1, 'Pincode is required.'),
})

const billingSchema = z.object({
  full_name: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(1),
})

const bodySchema = z.object({
  addressId: z.string().uuid().optional(),
  guest: guestSchema.optional(),
  billing: billingSchema.optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, 'Cart is empty'),
  saleCode: z.string().trim().min(1).optional(),
})

// Fixed shipping — configure via SHIPPING_PAISE env var (default ₹150)
function calcShipping(_subtotalPaise: number): number {
  return parseInt(process.env.SHIPPING_PAISE ?? '15000', 10)
}

export async function POST(request: NextRequest) {
  // ── Parse + validate body ────────────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }
  const { addressId, guest, billing, items, saleCode } = parsed.data
  const billingAddress = billing
    ? ({ ...billing, line2: billing.line2 ?? undefined, country: 'IN' } as unknown as Json)
    : null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const service = createServiceClient()

  // ── Resolve the buyer (logged-in OR guest) + shipping address ─
  let userId: string
  let shippingAddress: ShippingAddress

  if (user) {
    if (!addressId) return NextResponse.json({ error: 'Address required' }, { status: 400 })

    const { data: address } = await service
      .from('addresses')
      .select('*')
      .eq('id', addressId)
      .eq('user_id', user.id)
      .single()
    if (!address) return NextResponse.json({ error: 'Address not found' }, { status: 400 })

    const { data: profile } = await service
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single()

    userId = user.id
    shippingAddress = {
      line1: address.line1,
      ...(address.line2 ? { line2: address.line2 } : {}),
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
      full_name: address.full_name ?? profile?.full_name ?? user.email ?? 'Customer',
      phone: address.phone ?? profile?.phone ?? '',
      contact_email: address.contact_email ?? user.email ?? undefined,
    }
  } else {
    // Guest checkout — create/reuse a passwordless account for this email.
    if (!guest) return NextResponse.json({ error: 'Please enter your details' }, { status: 400 })

    const resolved = await getOrCreateUserByEmail(service, guest.email, guest.full_name)
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: 500 })
    userId = resolved.userId

    shippingAddress = {
      line1: guest.line1,
      ...(guest.line2 ? { line2: guest.line2 } : {}),
      city: guest.city,
      state: guest.state,
      pincode: guest.pincode,
      country: 'IN',
      full_name: guest.full_name,
      phone: guest.phone,
      contact_email: guest.email,
    }

    // Best-effort: fill the profile and save the address for future visits.
    await service.from('profiles').update({ full_name: guest.full_name, phone: guest.phone }).eq('id', userId)
    const { count } = await service
      .from('addresses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (!count) {
      await service.from('addresses').insert({
        user_id: userId,
        full_name: guest.full_name,
        phone: guest.phone,
        contact_email: guest.email,
        line1: guest.line1,
        line2: guest.line2 ?? null,
        city: guest.city,
        state: guest.state,
        pincode: guest.pincode,
        country: 'IN',
        is_default: true,
      })
    }
  }

  // ── Load + validate products ─────────────────────────────────
  const productIds = items.map((i) => i.productId)
  const { data: products } = await service
    .from('products')
    .select('id, name, price_paise, stock, is_active')
    .in('id', productIds)

  if (!products || products.length !== productIds.length) {
    return NextResponse.json({ error: 'One or more products not found' }, { status: 400 })
  }

  const productMap = new Map(products.map((p) => [p.id, p]))

  for (const item of items) {
    const p = productMap.get(item.productId)!
    if (!p.is_active) {
      return NextResponse.json({ error: `"${p.name}" is no longer available` }, { status: 400 })
    }
    if (p.stock < item.quantity) {
      return NextResponse.json(
        { error: `Not enough stock for "${p.name}" (${p.stock} left)` },
        { status: 409 },
      )
    }
  }

  // ── Totals ───────────────────────────────────────────────────
  const subtotalPaise = items.reduce(
    (s, i) => s + productMap.get(i.productId)!.price_paise * i.quantity,
    0,
  )

  // ── Apply sale code (validated + computed server-side) ───────
  let discountPaise = 0
  let saleId: string | null = null
  let freeShipping = false
  if (saleCode) {
    const result = await computeSaleDiscount(service, saleCode, userId, subtotalPaise)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
    discountPaise = result.discountPaise
    saleId = result.saleId
    freeShipping = result.freeShipping
  }

  const shippingPaise = freeShipping ? 0 : calcShipping(subtotalPaise)
  const totalPaise = subtotalPaise - discountPaise + shippingPaise

  // ── Create order ─────────────────────────────────────────────
  const orderNumber = generateOrderNumber()
  const { data: order, error: orderErr } = await service
    .from('orders')
    .insert({
      user_id: userId,
      order_number: orderNumber,
      status: 'created',
      subtotal_paise: subtotalPaise,
      shipping_paise: shippingPaise,
      discount_paise: discountPaise,
      sale_id: saleId,
      total_paise: totalPaise,
      shipping_address: shippingAddress as unknown as Json,
      billing_address: billingAddress,
    })
    .select('id')
    .single()

  if (orderErr || !order) {
    // Unique violation on the partial (sale_id, user_id) index = code already used.
    if (orderErr?.code === '23505' && saleId) {
      return NextResponse.json({ error: 'You have already used this code.' }, { status: 400 })
    }
    console.error('[orders/create] insert order:', orderErr)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  // ── Create order items ───────────────────────────────────────
  const { error: itemsErr } = await service.from('order_items').insert(
    items.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      product_name: productMap.get(i.productId)!.name,
      unit_price_paise: productMap.get(i.productId)!.price_paise,
      quantity: i.quantity,
    })),
  )

  if (itemsErr) {
    await service.from('orders').delete().eq('id', order.id)
    return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
  }

  // ── Decrement stock (atomic per product) ─────────────────────
  for (const item of items) {
    const { error: stockErr } = await service.rpc('decrement_stock', {
      p_product_id: item.productId,
      p_quantity: item.quantity,
    })
    if (stockErr) {
      await service.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
      const alreadyDecremented = items.slice(0, items.indexOf(item))
      for (const prev of alreadyDecremented) {
        await service.rpc('increment_stock', { p_product_id: prev.productId, p_quantity: prev.quantity })
      }
      return NextResponse.json(
        { error: `Out of stock: ${productMap.get(item.productId)!.name}` },
        { status: 409 },
      )
    }
  }

  // ── Create Razorpay order ────────────────────────────────────
  let rzpOrder: { id: string }
  try {
    rzpOrder = await getRazorpay().orders.create({
      amount: totalPaise,
      currency: 'INR',
      receipt: orderNumber,
      notes: { internal_order_id: order.id },
    }) as { id: string }
  } catch (err) {
    console.error('[orders/create] Razorpay:', err)
    await service.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
    for (const item of items) {
      await service.rpc('increment_stock', { p_product_id: item.productId, p_quantity: item.quantity })
    }
    return NextResponse.json({ error: 'Payment initialization failed. Please try again.' }, { status: 500 })
  }

  // ── Attach Razorpay order ID ─────────────────────────────────
  await service.from('orders').update({ razorpay_order_id: rzpOrder.id }).eq('id', order.id)

  return NextResponse.json({
    orderId: order.id,
    orderNumber,
    razorpayOrderId: rzpOrder.id,
    amountPaise: totalPaise,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  })
}
