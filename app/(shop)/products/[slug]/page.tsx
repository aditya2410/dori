import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Check } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { instagramConfig } from '@/lib/config'
import { AddToCart } from '@/components/shop/add-to-cart'
import { TrackViewContent } from '@/components/analytics/track-event'
import { StickyBuyBar } from '@/components/shop/sticky-buy-bar'
import { DmLove } from '@/components/shop/dm-love'
import { ImageGallery } from '@/components/shop/image-gallery'
import { DescriptionRenderer } from '@/components/shop/description-renderer'

export const revalidate = 3600

const TRUST_CHIPS = ['Cash on Delivery', 'Handmade in Jaipur', 'Ships in 3–5 days']

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { data } = await createServiceClient()
    .from('products')
    .select('name, description')
    .eq('slug', slug)
    .single()
  if (!data) return {}
  return {
    alternates: { canonical: `/products/${slug}` },
    title: data.name,
    description: data.description ?? undefined,
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const service = createServiceClient()
  const [{ data: product }, { data: communityPhotos }] = await Promise.all([
    service
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single(),
    service
      .from('community_photos')
      .select('id, url')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(3),
  ])

  if (!product) notFound()

  // Category eyebrow — the product's first (top-ordered) active collection.
  let category: string | null = null
  const { data: ps } = await service
    .from('product_series')
    .select('series_id, display_order')
    .eq('product_id', product.id)
    .order('display_order', { ascending: true })
    .limit(1)
  if (ps?.[0]) {
    const { data: s } = await service
      .from('series')
      .select('name')
      .eq('id', ps[0].series_id)
      .eq('is_active', true)
      .maybeSingle()
    category = s?.name ?? null
  }

  const images = Array.isArray(product.images) ? (product.images as string[]) : []

  // Discount is only shown when an admin has set a higher compare-at price.
  const comparePaise = product.compare_at_paise
  const hasDiscount = typeof comparePaise === 'number' && comparePaise > product.price_paise
  const percentOff = hasDiscount
    ? Math.round(((comparePaise - product.price_paise) / comparePaise) * 100)
    : 0

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 md:px-8 py-6 md:py-16">
      <TrackViewContent id={product.id} name={product.name} value={product.price_paise / 100} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 lg:gap-20">
        {/* Photos, with the video as the last gallery slide */}
        <div className="space-y-3">
          <ImageGallery
            images={images}
            productName={product.name}
            videoUrl={product.video_url}
            videoPosition={product.video_position}
          />
        </div>

        {/* Product info */}
        <div className="flex flex-col gap-6 md:pt-4">
          <div className="space-y-2">
            {category && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                {category}
              </p>
            )}
            <h1 className="font-serif text-3xl md:text-4xl font-normal leading-tight">
              {product.name}
            </h1>

            {/* Proof line — real social proof for a DM-native brand */}
            <a
              href={instagramConfig.url}
              target="_blank"
              rel="noopener noreferrer"
              data-track={`pdp-proof-line:${product.slug}`}
              className="flex flex-col gap-0.5 text-xs text-muted-foreground"
            >
              <span className="flex items-center gap-2">
                <span>Loved on Instagram</span>
                <span aria-hidden className="text-border">·</span>
                <span className="font-medium text-accent underline underline-offset-4">
                  {instagramConfig.handle}
                </span>
              </span>
              <span>real DMs below ↓</span>
            </a>

            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span className="text-2xl font-bold tracking-tight">{formatPrice(product.price_paise)}</span>
              {hasDiscount && (
                <>
                  <span className="text-base text-muted-foreground line-through">
                    {formatPrice(comparePaise!)}
                  </span>
                  <span className="bg-accent px-1.5 py-0.5 text-[11px] font-bold text-accent-foreground">
                    {percentOff}% OFF
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Honest urgency — small handmade batches mean low stock is real */}
          {product.stock > 0 && product.stock <= 5 && (
            <div className="flex flex-col gap-1 border border-accent/30 bg-accent/10 px-3 py-2.5 -mt-2">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-accent">
                <span aria-hidden className="size-[7px] rounded-full bg-[#c9531f] animate-pulse" />
                Selling fast — only {product.stock} left in stock
              </div>
              <p className="pl-[15px] text-[11px] text-muted-foreground">
                Each piece is beaded by hand
              </p>
            </div>
          )}

          {/* Trust chips — answer "can I trust this seller?" before the buttons */}
          <div className="flex flex-wrap gap-2">
            {TRUST_CHIPS.map((chip) => (
              <span
                key={chip}
                className="flex items-center gap-1.5 border px-2.5 py-1.5 text-[11px] text-foreground/75"
              >
                <Check aria-hidden className="size-3 text-[#1f7a4d]" />
                {chip}
              </span>
            ))}
          </div>

          {/* Desktop keeps the inline buttons; on mobile the pinned
              StickyBuyBar is the single buy affordance (avoids a redundant
              Add to Cart / Buy Now pair). */}
          <div className="hidden md:block pt-2">
            <AddToCart
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                pricePaise: product.price_paise,
                image: images[0] ?? null,
                stock: product.stock,
              }}
            />
          </div>

          {product.description && (
            product.description.trimStart().startsWith('<') ? (
              <div
                className="text-sm text-muted-foreground leading-relaxed [&_h2]:font-serif [&_h2]:text-base [&_h2]:font-medium [&_h2]:text-foreground [&_h2]:mt-4 [&_h2]:mb-1.5 [&_h3]:font-medium [&_h3]:text-foreground [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:mb-2.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2.5 [&_li]:mb-0.5 [&_strong]:font-medium [&_strong]:text-foreground [&_em]:italic"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : (
              <DescriptionRenderer text={product.description} />
            )
          )}

          {/* Social proof — real DMs and customer photos. This is the last
              section: the page ends at "See more love on @dori.jaipur" (no
              footer follows on product pages). */}
          <DmLove photos={communityPhotos ?? []} />

          {/* Mobile-only pinned buy bar (renders a spacer + fixed bar) */}
          <StickyBuyBar
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              pricePaise: product.price_paise,
              image: images[0] ?? null,
              stock: product.stock,
            }}
          />
        </div>
      </div>
    </div>
  )
}
