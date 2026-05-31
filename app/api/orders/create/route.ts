import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getRazorpay } from '@/lib/razorpay'
import { generateOrderNumber } from '@/lib/utils'
import type { ShippingAddress } from '@/types/database.types'

const bodySchema = z.object({
  addressId: z.string().uuid(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, 'Cart is empty'),
})

// Fixed shipping — configure via SHIPPING_PAISE env var (default ₹150)
function calcShipping(_subtotalPaise: number): number {
  return parseInt(process.env.SHIPPING_PAISE ?? '15000', 10)
}

export async function POST(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
  const { addressId, items } = parsed.data
  const service = createServiceClient()

  // ── Verify address belongs to this user ──────────────────────
  const { data: address } = await service
    .from('addresses')
    .select('*')
    .eq('id', addressId)
    .eq('user_id', user.id)
    .single()
  if (!address) return NextResponse.json({ error: 'Address not found' }, { status: 400 })

  // ── Load profile for shipping contact ───────────────────────
  const { data: profile } = await service
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .single()

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
  const shippingPaise = calcShipping(subtotalPaise)
  const totalPaise = subtotalPaise + shippingPaise

  const shippingAddress: ShippingAddress = {
    line1: address.line1,
    ...(address.line2 ? { line2: address.line2 } : {}),
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    country: address.country,
    full_name: profile?.full_name ?? user.email ?? 'Customer',
    phone: profile?.phone ?? '',
  }

  // ── Create order ─────────────────────────────────────────────
  const orderNumber = generateOrderNumber()
  const { data: order, error: orderErr } = await service
    .from('orders')
    .insert({
      user_id: user.id,
      order_number: orderNumber,
      status: 'created',
      subtotal_paise: subtotalPaise,
      shipping_paise: shippingPaise,
      total_paise: totalPaise,
      shipping_address: shippingAddress as unknown as import('@/types/database.types').Json,
    })
    .select('id')
    .single()

  if (orderErr || !order) {
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
