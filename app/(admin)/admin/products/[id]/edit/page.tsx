import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ProductForm } from '@/components/admin/product-form'

export const metadata = { title: 'Edit Product — Admin' }

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServiceClient()

  const [
    { data: product },
    { data: activeSeries },
    { data: productSeriesData },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, slug, description, price_paise, stock, is_active, is_bestseller, bestseller_order, images, video_url')
      .eq('id', id)
      .single(),
    supabase
      .from('series')
      .select('id, name')
      .eq('is_active', true)
      .order('display_order'),
    supabase
      .from('product_series')
      .select('series_id')
      .eq('product_id', id),
  ])

  if (!product) notFound()

  const currentSeriesId = productSeriesData?.[0]?.series_id ?? null

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground" asChild>
          <Link href="/admin/products">
            <ChevronLeft className="size-4" />
            Products
          </Link>
        </Button>
        <h1 className="font-serif text-3xl font-normal">Edit product</h1>
      </div>

      <ProductForm
        product={product}
        activeSeries={activeSeries ?? []}
        currentSeriesId={currentSeriesId}
      />
    </div>
  )
}
