import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/shop/product-card'

export const metadata: Metadata = { title: 'Shop' }

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, slug, name, price_paise, images')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div className="container py-16">
      <div className="mb-12 space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Collection</p>
        <h1 className="font-serif text-4xl font-normal">The Shop</h1>
      </div>

      {!products?.length ? (
        <p className="text-muted-foreground text-sm">No products available yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
