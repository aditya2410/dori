import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toggleSeriesActive } from './actions'
import { DeleteSeriesButton } from '@/components/admin/delete-series-button'

export const metadata: Metadata = { title: 'Collections — Admin' }

export default async function AdminSeriesPage() {
  const supabase = createServiceClient()

  const [{ data: seriesList }, { data: productSeriesRows }] = await Promise.all([
    supabase
      .from('series')
      .select('id, name, slug, display_order, is_active, cover_image_url')
      .order('display_order'),
    supabase.from('product_series').select('series_id'),
  ])

  const countMap = new Map<string, number>()
  for (const row of productSeriesRows ?? []) {
    countMap.set(row.series_id, (countMap.get(row.series_id) ?? 0) + 1)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-normal">Collections</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Group products into collections shown in your shop navigation.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/series/new">
            <Plus className="size-4" />
            New collection
          </Link>
        </Button>
      </div>

      {!seriesList?.length ? (
        <p className="text-muted-foreground text-sm py-8">No collections yet. Click "New collection" to get started.</p>
      ) : (
        <div className="border">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/40">
              <tr>
                <th className="text-left p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Collection</th>
                <th className="text-left p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Products</th>
                <th className="text-left p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Display Position</th>
                <th className="text-left p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Visibility</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {seriesList.map((s, i) => (
                <tr key={s.id} className={i < seriesList.length - 1 ? 'border-b' : ''}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {s.cover_image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.cover_image_url} alt="" className="size-9 object-cover shrink-0" />
                      )}
                      <span className="font-medium">{s.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">
                    {countMap.get(s.id) ?? 0} {(countMap.get(s.id) ?? 0) === 1 ? 'product' : 'products'}
                  </td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">#{s.display_order}</td>
                  <td className="p-4">
                    <Badge variant={s.is_active ? 'success' : 'secondary'}>
                      {s.is_active ? 'Visible in shop' : 'Hidden from shop'}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/series/${s.id}/edit`}>
                          <Pencil className="size-3.5" />
                          Edit
                        </Link>
                      </Button>
                      <form action={toggleSeriesActive.bind(null, s.id, !s.is_active)}>
                        <Button type="submit" variant="ghost" size="sm">
                          {s.is_active ? 'Hide from shop' : 'Show in shop'}
                        </Button>
                      </form>
                      <DeleteSeriesButton seriesId={s.id} seriesName={s.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
