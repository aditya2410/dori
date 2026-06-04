import { createServiceClient } from '@/lib/supabase/server'
import { BestSellersCarousel } from './best-sellers-carousel'

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
        <div className="text-center space-y-3 mb-16">
          <p className="font-sans text-xs tracking-[0.3em] text-muted-foreground uppercase">
            Best Sellers
          </p>
          <h2 className="font-serif text-3xl md:text-5xl font-light">
            Our Favourites
          </h2>
        </div>
      </div>

      {/* Full-bleed carousel — no container padding so cards reach the edge */}
      <div className="pl-[max(1rem,calc((100vw-1400px)/2+2rem))]">
        <BestSellersCarousel products={bestsellers} />
      </div>
    </section>
  )
}
