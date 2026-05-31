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

  const { data: product } = await supabase
    .from('products')
    .select('id, name, slug, description, price_paise, stock, is_active, images')
    .eq('id', id)
    .single()

  if (!product) notFound()

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

      <ProductForm product={product} />
    </div>
  )
}
