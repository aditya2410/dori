import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { OrderActions } from '@/components/admin/order-actions'
import { formatPrice } from '@/lib/utils'
import type { OrderStatus, ShippingAddress } from '@/types/database.types'

export const metadata: Metadata = { title: 'Order Detail — Admin' }

const statusVariant: Record<OrderStatus, 'default' | 'secondary' | 'success' | 'destructive' | 'outline' | 'warning'> = {
  created:   'outline',
  confirmed: 'warning',
  paid:      'secondary',
  shipped:   'default',
  delivered: 'success',
  cancelled: 'destructive',
  refunded:  'secondary',
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const service = createServiceClient()

  const { data: order } = await service
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  if (!order) notFound()

  const { data: orderItems } = await service
    .from('order_items')
    .select('product_name, quantity, unit_price_paise')
    .eq('order_id', id)

  // Get customer email from auth
  let customerEmail = '—'
  try {
    const { data: authUser } = await service.auth.admin.getUserById(order.user_id)
    customerEmail = authUser.user?.email ?? '—'
  } catch {}

  const addr = order.shipping_address as unknown as ShippingAddress

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div className="space-y-2">
        <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground" asChild>
          <Link href="/admin/orders">
            <ChevronLeft className="size-4" />
            Orders
          </Link>
        </Button>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-serif text-3xl font-normal">{order.order_number}</h1>
          <Badge variant={statusVariant[order.status as OrderStatus]}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
          {order.payment_method === 'cod' && <Badge variant="warning">Cash on Delivery</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(order.created_at).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </p>
      </div>

      {/* Actions */}
      <OrderActions orderId={order.id} status={order.status} />

      <Separator />

      {/* Customer */}
      <div className="space-y-3 text-sm">
        <h2 className="font-serif text-xl font-normal">Customer</h2>
        <div className="border p-4 space-y-2">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Name</p>
              <p className="font-medium">{addr.full_name}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Account email</p>
              <a href={`mailto:${customerEmail}`} className="hover:underline">{customerEmail}</a>
            </div>
            {addr.phone && (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Phone</p>
                <a href={`tel:${addr.phone}`} className="hover:underline">{addr.phone}</a>
              </div>
            )}
            {(addr as ShippingAddress & { contact_email?: string }).contact_email && (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Delivery email</p>
                <a
                  href={`mailto:${(addr as ShippingAddress & { contact_email?: string }).contact_email}`}
                  className="hover:underline"
                >
                  {(addr as ShippingAddress & { contact_email?: string }).contact_email}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Items */}
      <div className="space-y-3">
        <h2 className="font-serif text-xl font-normal">Items</h2>
        {orderItems?.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span>
              {item.product_name}{' '}
              <span className="text-muted-foreground">× {item.quantity}</span>
            </span>
            <span>{formatPrice(item.unit_price_paise * item.quantity)}</span>
          </div>
        ))}
      </div>

      <Separator />

      {/* Totals */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(order.subtotal_paise)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>{order.shipping_paise === 0 ? 'Free' : formatPrice(order.shipping_paise)}</span>
        </div>
        {order.cod_fee_paise > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">COD handling fee</span>
            <span>{formatPrice(order.cod_fee_paise)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>{formatPrice(order.total_paise)}</span>
        </div>
      </div>

      <Separator />

      {/* Shipping address */}
      <div className="space-y-1 text-sm">
        <h2 className="font-serif text-xl font-normal mb-3">Shipping Address</h2>
        <p>{addr.line1}</p>
        {addr.line2 && <p className="text-muted-foreground">{addr.line2}</p>}
        <p className="text-muted-foreground">
          {addr.city}, {addr.state} {addr.pincode}
        </p>
      </div>

      {/* Payment info */}
      <Separator />
      <div className="space-y-2 text-sm">
        <h2 className="font-serif text-xl font-normal mb-3">Payment</h2>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Method</span>
          <span>{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Prepaid (Razorpay)'}</span>
        </div>
        {order.payment_method === 'cod' ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">To collect on delivery</span>
            <span className="font-medium">{formatPrice(order.total_paise)}</span>
          </div>
        ) : (
          <>
            {order.razorpay_payment_id && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment ID</span>
                <span className="font-mono text-xs">{order.razorpay_payment_id}</span>
              </div>
            )}
            {order.razorpay_order_id && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-mono text-xs">{order.razorpay_order_id}</span>
              </div>
            )}
          </>
        )}
        {order.tracking_number && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tracking</span>
            <span>{order.tracking_number}</span>
          </div>
        )}
      </div>
    </div>
  )
}
