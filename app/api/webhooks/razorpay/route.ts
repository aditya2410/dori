import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/razorpay'
import { createServiceClient } from '@/lib/supabase/server'
import { sendOrderConfirmationEmail } from '@/lib/email'
import type { ShippingAddress } from '@/types/database.types'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature') ?? ''

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: { event: string; payload?: { payment?: { entity?: Record<string, unknown> } } }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const service = createServiceClient()

  // ── payment.failed — cancel order + restore stock ────────────
  if (event.event === 'payment.failed') {
    const failedOrderId = event.payload?.payment?.entity?.order_id as string | undefined
    if (failedOrderId) {
      const { data: order } = await service
        .from('orders')
        .select('id, status')
        .eq('razorpay_order_id', failedOrderId)
        .single()

      if (order?.status === 'created') {
        await service.from('orders').update({ status: 'cancelled' }).eq('id', order.id)

        const { data: items } = await service
          .from('order_items')
          .select('product_id, quantity')
          .eq('order_id', order.id)

        for (const item of items ?? []) {
          await service.rpc('increment_stock', {
            p_product_id: item.product_id,
            p_quantity: item.quantity,
          })
        }
      }
    }
    return NextResponse.json({ received: true })
  }

  if (event.event !== 'payment.captured') {
    return NextResponse.json({ received: true })
  }

  const payment = event.payload?.payment?.entity
  const razorpayPaymentId = payment?.id as string | undefined
  const razorpayOrderId = payment?.order_id as string | undefined
  const paymentAmountPaise = payment?.amount as number | undefined

  if (!razorpayPaymentId || !razorpayOrderId) {
    return NextResponse.json({ error: 'Missing payment data' }, { status: 400 })
  }

  // ── Idempotency: skip if already processed ───────────────────
  const { data: existing } = await service
    .from('orders')
    .select('id')
    .eq('razorpay_payment_id', razorpayPaymentId)
    .single()

  if (existing) return NextResponse.json({ received: true })

  // ── Find the order by Razorpay order ID ─────────────────────
  const { data: order } = await service
    .from('orders')
    .select('id, user_id, order_number, status, total_paise, shipping_paise, subtotal_paise, shipping_address')
    .eq('razorpay_order_id', razorpayOrderId)
    .single()

  if (!order || order.status !== 'created') {
    return NextResponse.json({ received: true })
  }

  // ── Amount verification: payment must match our stored total ──
  // Razorpay already enforces this, but defense-in-depth catches
  // any edge cases where the amounts diverge.
  if (paymentAmountPaise !== undefined && paymentAmountPaise !== order.total_paise) {
    console.error('[webhook] amount mismatch', {
      paid: paymentAmountPaise,
      expected: order.total_paise,
      orderId: order.id,
    })
    return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
  }

  // ── Mark paid ─────────────────────────────────────────────────
  await service
    .from('orders')
    .update({ status: 'paid', razorpay_payment_id: razorpayPaymentId })
    .eq('id', order.id)

  // ── Send confirmation email ───────────────────────────────────
  try {
    const { data: authUser } = await service.auth.admin.getUserById(order.user_id)
    const email = authUser.user?.email
    if (!email) throw new Error('No email for user')

    const { data: items } = await service
      .from('order_items')
      .select('product_name, quantity, unit_price_paise')
      .eq('order_id', order.id)

    await sendOrderConfirmationEmail({
      to: email,
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
    console.error('[webhook] email:', err)
  }

  return NextResponse.json({ received: true })
}
