import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SeriesForm } from '@/components/admin/series-form'
import { ProductOrderList } from '@/components/admin/product-order-list'

export const metadata: Metadata = { title: 'Edit Collection — Admin' }

export default async function EditSeriesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServiceClient()

  const [{ data: series }, { data: productSeriesRows }] = await Promise.all([
    supabase
      .from('series')
      .select('id, name, slug, description, cover_image_url, video_url, image_position, display_order, is_active')
      .eq('id', id)
      .single(),
    supabase
      .from('product_series')
      .select('product_id, display_order')
      .eq('series_id', id)
      .order('display_order', { ascending: true }),
  ])

  if (!series) notFound()

  // Fetch the actual product details in display_order
  const productIds = (productSeriesRows ?? []).map((r) => r.product_id)
  const products = productIds.length > 0
    ? await supabase
        .from('products')
        .select('id, name, images')
        .in('id', productIds)
        .then(({ data }) => {
          // Preserve display_order from product_series
          const map = Object.fromEntries((data ?? []).map((p) => [p.id, p]))
          return productIds.map((pid) => map[pid]).filter(Boolean)
        })
    : []

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="space-y-1">
        <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground" asChild>
          <Link href="/admin/series">
            <ChevronLeft className="size-4" />
            Collections
          </Link>
        </Button>
        <h1 className="font-serif text-3xl font-normal">Edit collection</h1>
      </div>

      <SeriesForm series={series} />

      <Separator />

      <div className="space-y-4">
        <div>
          <h2 className="font-serif text-xl font-normal">Product order</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Drag products to set the order they appear in this collection.
          </p>
        </div>
        <ProductOrderList seriesId={id} initialProducts={products} />
      </div>
    </div>
  )
}
