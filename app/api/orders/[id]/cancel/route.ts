import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  // No session required — guests can abandon payment too. The order UUID is the
  // capability, and only unpaid ("created") orders can be cancelled here.
  const service = createServiceClient()

  const { data: order } = await service
    .from('orders')
    .select('id')
    .eq('id', id)
    .eq('status', 'created')
    .single()

  if (!order) {
    // Already cancelled, paid, or doesn't exist — treat as success (idempotent)
    return NextResponse.json({ ok: true })
  }

  const { data: items } = await service
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', id)

  await service
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('status', 'created')

  for (const item of items ?? []) {
    await service.rpc('increment_stock', {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    })
  }

  return NextResponse.json({ ok: true })
}
