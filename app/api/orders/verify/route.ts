import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { verifyPaymentSignature } from '@/lib/razorpay'
import { sendOrderConfirmationEmail } from '@/lib/email'
import type { ShippingAddress } from '@/types/database.types'

const bodySchema = z.object({
  orderId: z.string().uuid(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
})

export async function POST(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Parse body ───────────────────────────────────────────────
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
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data

  // ── Verify HMAC signature ─────────────────────────────────────
  const valid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
  }

  const service = createServiceClient()

  // ── Load order — confirm it belongs to this user ─────────────
  const { data: order } = await service
    .from('orders')
    .select('id, user_id, order_number, status, razorpay_order_id, total_paise, shipping_paise, subtotal_paise, shipping_address')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.status === 'paid') {
    return NextResponse.json({ success: true }) // idempotent
  }
  if (order.status !== 'created') {
    return NextResponse.json({ error: 'Order cannot be paid' }, { status: 400 })
  }

  // Defense-in-depth: the signed razorpayOrderId must match what we stored.
  // Prevents a valid signature for a different Razorpay order being replayed.
  if (order.razorpay_order_id !== razorpayOrderId) {
    console.error('[orders/verify] Razorpay order ID mismatch', {
      stored: order.razorpay_order_id,
      received: razorpayOrderId,
    })
    return NextResponse.json({ error: 'Order ID mismatch' }, { status: 400 })
  }

  // ── Mark paid ─────────────────────────────────────────────────
  const { error: updateErr } = await service
    .from('orders')
    .update({
      status: 'paid',
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    })
    .eq('id', orderId)

  if (updateErr) {
    console.error('[orders/verify] update:', updateErr)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }

  // ── Send confirmation email ───────────────────────────────────
  try {
    const { data: items } = await service
      .from('order_items')
      .select('product_name, quantity, unit_price_paise')
      .eq('order_id', orderId)

    await sendOrderConfirmationEmail({
      to: user.email!,
      orderNumber: order.order_number,
      items: (items ?? []).map((i) => ({
        name: i.product_name,
        quantity: i.quantity,
        unitPricePaise: i.unit_price_paise,
      })),
      subtotalPaise: order.subtotal_paise,
      shippingPaise: order.shipping_paise,
      totalPaise: order.total_paise,
      shippingAddress: order.shipping_address as unknown as ShippingAddress,
    })
  } catch (err) {
    // Email failure must not block the payment success response
    console.error('[orders/verify] email:', err)
  }

  return NextResponse.json({ success: true })
}
