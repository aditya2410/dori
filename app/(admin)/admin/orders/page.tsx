import Link from 'next/link'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/utils'
import { QuickOrderAction } from '@/components/admin/quick-order-action'
import { ClearHistoryButton } from '@/components/admin/clear-history-button'
import type { OrderStatus, ShippingAddress } from '@/types/database.types'

export const metadata: Metadata = { title: 'Orders — Admin' }

const FILTERS = [
  { label: 'All',              value: '' },
  { label: 'Awaiting Payment', value: 'created' },
  { label: 'Paid',             value: 'paid' },
  { label: 'Shipped',          value: 'shipped' },
  { label: 'Delivered',        value: 'delivered' },
  { label: 'Cancelled',        value: 'cancelled' },
  { label: 'Refunded',         value: 'refunded' },
]

const statusVariant: Record<OrderStatus, 'default' | 'secondary' | 'success' | 'destructive' | 'outline'> = {
  created:   'outline',
  paid:      'secondary',
  shipped:   'default',
  delivered: 'success',
  cancelled: 'destructive',
  refunded:  'secondary',
}

const statusLabel: Record<OrderStatus, string> = {
  created:   'Awaiting Payment',
  paid:      'Paid — Ready to Ship',
  shipped:   'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded:  'Refunded',
}

const CLEARABLE_STATUSES: OrderStatus[] = ['delivered', 'cancelled', 'refunded']

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; history?: string }>
}) {
  const { status, history } = await searchParams
  const showHistory = history === '1'
  const supabase = createServiceClient()

  let query = supabase
    .from('orders')
    .select('id, order_number, status, total_paise, created_at, shipping_address')
    .eq('settled', showHistory)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status as OrderStatus)

  const { data: orders } = await query

  // Count clearable and still-active orders — only needed on the active view
  let clearableCount = 0
  let paidCount = 0
  let shippedCount = 0
  if (!showHistory) {
    const [{ count: clearable }, { count: paid }, { count: shipped }] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('settled', false).in('status', CLEARABLE_STATUSES),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('settled', false).eq('status', 'paid'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('settled', false).eq('status', 'shipped'),
    ])
    clearableCount = clearable ?? 0
    paidCount = paid ?? 0
    shippedCount = shipped ?? 0
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-normal">
            {showHistory ? 'Cleared Orders' : 'Orders'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {showHistory ? (
              <Link href="/admin/orders" className="hover:underline underline-offset-4">
                ← Back to active orders
              </Link>
            ) : (
              <>
                When an order is <strong>Paid</strong>, mark it shipped, then mark it delivered once it arrives.
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-1">
          {!showHistory && clearableCount > 0 && (
            <ClearHistoryButton count={clearableCount} paidCount={paidCount} shippedCount={shippedCount} />
          )}
          {!showHistory && (
            <Link
              href="/admin/orders?history=1"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              View history
            </Link>
          )}
        </div>
      </div>

      <Separator />

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {FILTERS.map((f) => {
          const href = new URLSearchParams({
            ...(f.value ? { status: f.value } : {}),
            ...(showHistory ? { history: '1' } : {}),
          }).toString()
          return (
            <Link
              key={f.value}
              href={href ? `/admin/orders?${href}` : '/admin/orders'}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider border transition-colors ${
                (status ?? '') === f.value
                  ? 'bg-foreground text-background border-foreground'
                  : 'text-muted-foreground border-border hover:border-foreground/50'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {!orders?.length ? (
        <p className="text-muted-foreground text-sm py-8">
          {showHistory ? 'No cleared orders.' : 'No active orders.'}
        </p>
      ) : (
        <div className="border">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/40">
              <tr>
                <th className="text-left p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Order</th>
                <th className="text-left p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Customer</th>
                <th className="text-left p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Date</th>
                <th className="text-left p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="text-right p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Total</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => {
                const addr = order.shipping_address as unknown as ShippingAddress
                return (
                  <tr
                    key={order.id}
                    className={`hover:bg-secondary/30 transition-colors ${i < orders.length - 1 ? 'border-b' : ''}`}
                  >
                    <td className="p-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium hover:underline underline-offset-4"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">
                      {addr?.full_name ?? '—'}
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="p-4">
                      <Badge variant={statusVariant[order.status as OrderStatus]}>
                        {statusLabel[order.status as OrderStatus] ?? order.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right font-medium">
                      {formatPrice(order.total_paise)}
                    </td>
                    <td className="p-4">
                      {!showHistory && <QuickOrderAction orderId={order.id} status={order.status} />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
