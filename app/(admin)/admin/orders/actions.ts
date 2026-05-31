'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { getRazorpay } from '@/lib/razorpay'
import { sendShippingEmail } from '@/lib/email'

export type ShipState = { error: string } | null

function revalidate(orderId: string) {
  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')
  revalidatePath('/account/orders')
  revalidatePath(`/account/orders/${orderId}`)
}

export async function markShippedAction(
  orderId: string,
  _prev: ShipState,
  formData: FormData,
): Promise<ShipState> {
  const tracking = (formData.get('tracking') as string)?.trim()
  if (!tracking) return { error: 'Tracking number is required.' }

  const service = createServiceClient()
  const { data: order, error } = await service
    .from('orders')
    .update({ status: 'shipped', tracking_number: tracking })
    .eq('id', orderId)
    .eq('status', 'paid')
    .select('order_number, user_id')
    .single()

  if (error || !order) return { error: 'Failed to update order — it may already be shipped.' }

  try {
    const { data: authUser } = await service.auth.admin.getUserById(order.user_id)
    if (authUser.user?.email) {
      await sendShippingEmail({
        to: authUser.user.email,
        orderNumber: order.order_number,
        trackingNumber: tracking,
      })
    }
  } catch (err) {
    console.error('[markShipped] email:', err)
  }

  revalidate(orderId)
  return null
}

export async function markDelivered(orderId: string): Promise<void> {
  const service = createServiceClient()
  await service.from('orders').update({ status: 'delivered' }).eq('id', orderId).eq('status', 'shipped')
  revalidate(orderId)
}

export async function cancelOrder(orderId: string): Promise<void> {
  const service = createServiceClient()

  const { data: items } = await service
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId)

  const { error } = await service
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .in('status', ['created', 'paid'])

  if (!error) {
    for (const item of items ?? []) {
      await service.rpc('increment_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      })
    }
  }

  revalidate(orderId)
}

export async function refundOrder(orderId: string): Promise<void> {
  const service = createServiceClient()

  const { data: order } = await service
    .from('orders')
    .select('total_paise, razorpay_payment_id')
    .eq('id', orderId)
    .single()

  // Attempt Razorpay refund if payment ID exists
  if (order?.razorpay_payment_id) {
    try {
      await getRazorpay().payments.refund(order.razorpay_payment_id, {
        amount: order.total_paise,
      })
    } catch (err) {
      console.error('[refundOrder] Razorpay refund failed:', err)
      // Continue marking as refunded even if API call fails — admin can retry in Razorpay dashboard
    }
  }

  await service
    .from('orders')
    .update({ status: 'refunded' })
    .eq('id', orderId)
    .in('status', ['paid', 'shipped', 'delivered'])

  revalidate(orderId)
}
