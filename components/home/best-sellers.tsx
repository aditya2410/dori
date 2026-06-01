import { createServiceClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/shop/product-card'

export async function BestSellers() {
  const { data: bestsellers } = await createServiceClient()
    .from('products')
    .select('id, slug, name, price_paise, images')
    .eq('is_bestseller', true)
    .eq('is_active', true)
    .order('bestseller_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(8)

  if (!bestsellers?.length) return null

  return (
    <section className="py-20 md:py-32">
      <div className="container">
        <div className="text-center space-y-3">
          <p className="font-sans text-xs tracking-[0.3em] text-muted-foreground uppercase">
            Best Sellers
          </p>
          <h2 className="font-serif text-3xl md:text-5xl font-light">
            Our Favourites
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 mt-16">
          {bestsellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
