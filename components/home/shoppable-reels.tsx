import { createServiceClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { instagramConfig } from '@/lib/config'
import { ReelsCarousel, type ReelItem } from './reels-carousel'

type ReelProduct = { slug: string; name: string; price_paise: number; images: unknown }

/**
 * "Shop our reels" — the curated Instagram-reel row, managed from /admin/reels.
 * Each reel can link to a product (tap → product page, where it's shoppable) or
 * just play. Renders nothing until an admin adds reels.
 */
export async function ShoppableReels() {
  const service = createServiceClient()

  const { data: reels } = await service
    .from('home_reels')
    .select('id, video_url, caption, product_id')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(12)

  if (!reels?.length) return null

  // Resolve linked products in one follow-up query (matches the app's pattern of
  // fetch-then-map rather than typed embeds).
  const productIds = reels.map((r) => r.product_id).filter((id): id is string => !!id)
  const { data: products } = productIds.length
    ? await service
        .from('products')
        .select('id, slug, name, price_paise, images')
        .in('id', productIds)
    : { data: [] }
  const productMap = new Map((products ?? []).map((p) => [p.id, p as { id: string } & ReelProduct]))

  const items: ReelItem[] = reels.map((reel) => {
    const product = reel.product_id ? productMap.get(reel.product_id) : undefined
    const imgs = product && Array.isArray(product.images) ? (product.images as string[]) : []
    return {
      id: reel.id,
      videoUrl: reel.video_url,
      poster: imgs[0] ?? undefined,
      href: product ? `/products/${product.slug}` : instagramConfig.url,
      external: !product,
      label: product ? `Shop now · ${formatPrice(product.price_paise)}` : (reel.caption ?? 'Watch'),
      track: product ? `reel-shop:${product.slug}` : `reel-watch:${reel.id}`,
    }
  })

  return (
    <section className="py-16 md:py-24 overflow-hidden">
      <div className="container mb-8 flex items-baseline justify-between gap-4">
        <div className="space-y-1">
          <p className="font-sans text-xs tracking-[0.3em] text-muted-foreground uppercase">
            Shop our reels
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-light">As seen on Instagram</h2>
        </div>
        <a
          href={instagramConfig.url}
          target="_blank"
          rel="noopener noreferrer"
          data-track="reels-handle"
          className="shrink-0 text-xs font-semibold text-accent hover:opacity-70 transition-opacity"
        >
          {instagramConfig.handle}
        </a>
      </div>

      <ReelsCarousel reels={items} />
    </section>
  )
}
