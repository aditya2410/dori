import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductForm } from '@/components/admin/product-form'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata = { title: 'New Product — Admin' }

export default async function NewProductPage() {
  const { data: activeSeries } = await createServiceClient()
    .from('series')
    .select('id, name')
    .eq('is_active', true)
    .order('display_order')

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground" asChild>
          <Link href="/admin/products">
            <ChevronLeft className="size-4" />
            Products
          </Link>
        </Button>
        <h1 className="font-serif text-3xl font-normal">New product</h1>
      </div>

      <ProductForm activeSeries={activeSeries ?? []} />
    </div>
  )
}
