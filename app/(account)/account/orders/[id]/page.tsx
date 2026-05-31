import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Package, Truck, CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import type { OrderStatus, ShippingAddress } from '@/types/database.types'

export const metadata: Metadata = { title: 'Order Detail' }

type TimelineStep = {
  status: OrderStatus
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const TIMELINE: TimelineStep[] = [
  { status: 'paid',      label: 'Order confirmed',  icon: CheckCircle },
  { status: 'shipped',   label: 'Shipped',           icon: Truck },
  { status: 'delivered', label: 'Delivered',         icon: Package },
]

const TERMINAL_BAD: OrderStatus[] = ['cancelled', 'refunded']

const statusVariant: Record<OrderStatus, 'default' | 'secondary' | 'success' | 'destructive' | 'outline'> = {
  created:   'outline',
  paid:      'secondary',
  shipped:   'default',
  delivered: 'success',
  cancelled: 'destructive',
  refunded:  'secondary',
}

function statusRank(s: OrderStatus): number {
  const order: OrderStatus[] = ['created', 'paid', 'shipped', 'delivered']
  return order.indexOf(s)
}

export default async function OrderDetailPage({
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

  const { data: orderItems } = await service
    .from('order_items')
    .select('product_name, quantity, unit_price_paise')
    .eq('order_id', id)

  if (!order) notFound()

  const addr = order.shipping_address as unknown as ShippingAddress
  const isBad = TERMINAL_BAD.includes(order.status as OrderStatus)

  return (
    <div className="space-y-8">
      {/* Back */}
      <div className="space-y-1">
        <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground" asChild>
          <Link href="/account/orders">
            <ChevronLeft className="size-4" />
            Orders
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-3xl font-normal">{order.order_number}</h1>
          <Badge variant={statusVariant[order.status as OrderStatus]}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Placed on{' '}
          {new Date(order.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Status timeline */}
      {!isBad ? (
        <div className="flex items-start gap-0">
          {TIMELINE.map((step, i) => {
            const done = statusRank(order.status as OrderStatus) >= statusRank(step.status)
            const Icon = step.icon
            return (
              <div key={step.status} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`size-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                      done
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-background text-muted-foreground'
                    }`}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider whitespace-nowrap ${done ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                  {step.status === 'shipped' && order.tracking_number && (
                    <span className="text-[10px] text-muted-foreground">{order.tracking_number}</span>
                  )}
                </div>
                {i < TIMELINE.length - 1 && (
                  <div className={`flex-1 h-px mb-5 mx-2 ${done ? 'bg-foreground' : 'bg-border'}`} />
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex items-center gap-3 text-sm text-muted-foreground border p-4">
          {order.status === 'cancelled' ? (
            <XCircle className="size-4 shrink-0" />
          ) : (
            <RotateCcw className="size-4 shrink-0" />
          )}
          This order was {order.status}.
        </div>
      )}

      <Separator />

      {/* Items */}
      <div className="space-y-4">
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
        <p className="font-medium">{addr.full_name}</p>
        <p className="text-muted-foreground">{addr.line1}</p>
        {addr.line2 && <p className="text-muted-foreground">{addr.line2}</p>}
        <p className="text-muted-foreground">
          {addr.city}, {addr.state} {addr.pincode}
        </p>
        {addr.phone && <p className="text-muted-foreground">{addr.phone}</p>}
      </div>
    </div>
  )
}
