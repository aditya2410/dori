import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Package } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/utils'
import type { ShippingAddress } from '@/types/database.types'

export const metadata: Metadata = { title: 'Order Confirmed' }

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: order } = await service
    .from('orders')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!order) notFound()
  if (order.status !== 'paid') redirect('/account/orders')

  const { data: orderItems } = await service
    .from('order_items')
    .select('product_name, quantity, unit_price_paise')
    .eq('order_id', id)

  const addr = order.shipping_address as unknown as ShippingAddress

  return (
    <div className="container py-16 max-w-xl">
      <div className="space-y-8">
        {/* Confirmation header */}
        <div className="text-center space-y-3">
          <CheckCircle className="size-12 text-foreground mx-auto" strokeWidth={1.5} />
          <h1 className="font-serif text-3xl font-normal">Order Confirmed</h1>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation to <span className="text-foreground">{user.email}</span>
          </p>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {order.order_number}
          </p>
        </div>

        <Separator />

        {/* Items */}
        <div className="space-y-3">
          {orderItems?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>
                {item.product_name}{' '}
                <span className="text-muted-foreground">× {item.quantity}</span>
              </span>
              <span>{formatPrice(item.unit_price_paise * item.quantity)}</span>
            </div>
          ))}

          <Separator />

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(order.subtotal_paise)}</span>
          </div>
          {order.discount_paise > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span>−{formatPrice(order.discount_paise)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span>{order.shipping_paise === 0 ? 'Free' : formatPrice(order.shipping_paise)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{formatPrice(order.total_paise)}</span>
          </div>
        </div>

        <Separator />

        {/* Address */}
        <div className="space-y-1 text-sm">
          <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Package className="size-3" /> Delivering to
          </p>
          <p className="font-medium">{addr.full_name}</p>
          <p className="text-muted-foreground">{addr.line1}</p>
          {addr.line2 && <p className="text-muted-foreground">{addr.line2}</p>}
          <p className="text-muted-foreground">
            {addr.city}, {addr.state} {addr.pincode}
          </p>
          {addr.phone && <p className="text-muted-foreground">{addr.phone}</p>}
        </div>

        <Separator />

        <p className="text-sm text-muted-foreground text-center leading-relaxed">
          Handcrafted orders ship within 3–5 business days.
          You'll receive a shipping notification once your order is on its way.
        </p>

        <div className="flex flex-col gap-3">
          <Button asChild size="lg">
            <Link href="/account/orders">View all orders</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/products">Continue shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
