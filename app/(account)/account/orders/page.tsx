import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/utils'
import type { OrderStatus } from '@/types/database.types'

export const metadata: Metadata = { title: 'Orders' }

const statusVariant: Record<OrderStatus, 'default' | 'secondary' | 'success' | 'destructive' | 'outline'> = {
  created:   'outline',
  paid:      'secondary',
  shipped:   'default',
  delivered: 'success',
  cancelled: 'destructive',
  refunded:  'secondary',
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await createServiceClient()
    .from('orders')
    .select('id, order_number, status, total_paise, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-normal">Orders</h1>
        <p className="text-sm text-muted-foreground">
          {orders?.length ?? 0} order{orders?.length !== 1 ? 's' : ''}
        </p>
      </div>

      {!orders?.length ? (
        <div className="py-12 text-center space-y-3">
          <p className="text-muted-foreground text-sm">You haven't placed any orders yet.</p>
          <Link href="/products" className="text-sm underline underline-offset-4 hover:opacity-70 transition-opacity">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-0">
          {orders.map((order, i) => (
            <div key={order.id}>
              <Link
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between py-5 hover:opacity-70 transition-opacity group"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={statusVariant[order.status as OrderStatus]}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  <span className="text-sm font-medium">{formatPrice(order.total_paise)}</span>
                  <span className="text-muted-foreground text-xs group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </Link>
              {i < orders.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
