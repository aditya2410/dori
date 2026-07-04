import Link from 'next/link'
import { Play } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { instagramConfig } from '@/lib/config'

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

      <div className="flex gap-4 overflow-x-auto px-4 md:px-8 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {reels.map((reel) => {
          const product = reel.product_id ? productMap.get(reel.product_id) : undefined
          const imgs = product && Array.isArray(product.images) ? (product.images as string[]) : []
          const poster = imgs[0] ?? undefined
          const href = product ? `/products/${product.slug}` : instagramConfig.url
          const external = !product

          const card = (
            <div className="relative aspect-[2/3]">
              <video
                src={reel.video_url}
                poster={poster}
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
                className="h-full w-full object-cover"
              />
              {/* Subtle wash + reel affordance, matching the design's minimal tiles */}
              <span className="pointer-events-none absolute inset-0 bg-black/20" />
              <Play aria-hidden className="pointer-events-none absolute top-2.5 right-2.5 size-3.5 fill-white text-white drop-shadow" />
              <span className="pointer-events-none absolute bottom-2.5 left-2.5 right-2.5 text-[11px] font-semibold text-white drop-shadow">
                {product ? `Shop now · ${formatPrice(product.price_paise)}` : (reel.caption ?? 'Watch')}
              </span>
            </div>
          )

          const className = 'group relative block w-40 md:w-52 shrink-0 overflow-hidden bg-secondary'

          return external ? (
            <a
              key={reel.id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              data-track={`reel-watch:${reel.id}`}
              className={className}
            >
              {card}
            </a>
          ) : (
            <Link
              key={reel.id}
              href={href}
              data-track={`reel-shop:${product!.slug}`}
              className={className}
            >
              {card}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
