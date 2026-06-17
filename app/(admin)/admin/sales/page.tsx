import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toggleSaleActive } from './actions'
import { DeleteSaleButton } from '@/components/admin/delete-sale-button'

export const metadata = { title: 'Sales — Admin' }

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
})

export default async function AdminSalesPage() {
  const supabase = createServiceClient()
  const { data: sales, error } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) console.error('[admin/sales]', error)

  // Tally redemptions per code (non-cancelled orders) in a single query.
  const { data: usedRows } = await supabase
    .from('orders')
    .select('sale_id')
    .neq('status', 'cancelled')
    .not('sale_id', 'is', null)
  const usageCount = new Map<string, number>()
  for (const r of usedRows ?? []) {
    if (r.sale_id) usageCount.set(r.sale_id, (usageCount.get(r.sale_id) ?? 0) + 1)
  }

  const now = Date.now()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-normal">Sales</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discount codes customers apply at checkout. Each code works once per customer.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/sales/new">
            <Plus className="size-4" />
            Add sale
          </Link>
        </Button>
      </div>

      {!sales?.length ? (
        <p className="text-muted-foreground text-sm">No sales yet. Click "Add sale" to create a code.</p>
      ) : (
        <div className="border">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/40">
              <tr>
                <th className="text-left p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Code</th>
                <th className="text-left p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Discount</th>
                <th className="text-left p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Window</th>
                <th className="text-left p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Used</th>
                <th className="text-left p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {sales.map((sale, i) => {
                const started = new Date(sale.starts_at).getTime() <= now
                const ended = new Date(sale.ends_at).getTime() < now
                const live = sale.is_active && started && !ended
                const status = !sale.is_active ? 'Disabled' : ended ? 'Expired' : !started ? 'Scheduled' : 'Live'
                return (
                  <tr key={sale.id} className={i < sales.length - 1 ? 'border-b' : ''}>
                    <td className="p-4">
                      <span className="font-medium tracking-wider">{sale.code}</span>
                      {sale.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{sale.description}</p>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {sale.discount_percent}% off
                      {sale.max_discount_paise != null && (
                        <span className="block text-xs">up to {formatPrice(sale.max_discount_paise)}</span>
                      )}
                      {sale.min_order_paise != null && (
                        <span className="block text-xs">min {formatPrice(sale.min_order_paise)}</span>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell text-xs">
                      {dateFmt.format(new Date(sale.starts_at))}
                      <br />→ {dateFmt.format(new Date(sale.ends_at))}
                      {sale.usage_limit != null && (
                        <span className="block mt-1">Limit: {sale.usage_limit} uses</span>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {usageCount.get(sale.id) ?? 0}
                      {sale.usage_limit != null && ` / ${sale.usage_limit}`}
                    </td>
                    <td className="p-4">
                      <Badge variant={live ? 'success' : 'secondary'}>{status}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/sales/${sale.id}/edit`}>
                            <Pencil className="size-3.5" />
                            Edit
                          </Link>
                        </Button>
                        <form action={toggleSaleActive.bind(null, sale.id, !sale.is_active)}>
                          <Button type="submit" variant="ghost" size="sm">
                            {sale.is_active ? 'Disable' : 'Enable'}
                          </Button>
                        </form>
                        <DeleteSaleButton saleId={sale.id} code={sale.code} />
                      </div>
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
