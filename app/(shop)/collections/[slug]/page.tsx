import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/shop/product-card'
import { LoopingVideo } from '@/components/shop/looping-video'
import { BLUR_PLACEHOLDER } from '@/lib/utils'

export const revalidate = 3600

export async function generateStaticParams() {
  const { data } = await createServiceClient()
    .from('series')
    .select('slug')
    .eq('is_active', true)
  return (data ?? []).map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { data } = await createServiceClient()
    .from('series')
    .select('name, description, cover_image_url')
    .eq('slug', slug)
    .single()
  if (!data) return {}
  return {
    alternates: { canonical: `/collections/${slug}` },
    title: data.name,
    description: data.description ?? undefined,
    openGraph: {
      title: data.name,
      description: data.description ?? undefined,
      images: data.cover_image_url ? [data.cover_image_url] : [],
    },
  }
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: series } = await supabase
    .from('series')
    .select('id, name, description, cover_image_url, video_url, image_position')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!series) notFound()

  // Fetch products ordered by the admin-defined display_order
  const { data: productSeriesRows } = await supabase
    .from('product_series')
    .select('product_id, display_order')
    .eq('series_id', series.id)
    .order('display_order', { ascending: true })

  const productIds = (productSeriesRows ?? []).map((r) => r.product_id)

  const products =
    productIds.length > 0
      ? await supabase
          .from('products')
          .select('id, slug, name, price_paise, images')
          .in('id', productIds)
          .eq('is_active', true)
          .then(({ data }) => {
            // Preserve the display_order from product_series
            const map = Object.fromEntries((data ?? []).map((p) => [p.id, p]))
            return productIds.map((pid) => map[pid]).filter(Boolean)
          })
      : []

  return (
    <>
      {/* Hero — video takes priority over cover image */}
      <section className="relative w-full h-[50vh] md:h-[65vh] overflow-hidden">
        {series.video_url ? (
          <LoopingVideo
            src={series.video_url}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : series.cover_image_url ? (
          <Image
            src={series.cover_image_url}
            alt={series.name}
            fill
            sizes="100vw"
            priority
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
            className={`object-cover object-${series.image_position ?? 'center'}`}
          />
        ) : (
          <div className="h-full bg-secondary" />
        )}
        {(series.video_url || series.cover_image_url) && (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 md:pb-16 px-6 text-center">
          <h1 className={`font-serif text-4xl md:text-6xl font-light tracking-tight ${(series.video_url || series.cover_image_url) ? 'text-white' : 'text-foreground'}`}>
            {series.name}
          </h1>
          {series.description && (
            <p className={`font-sans text-sm md:text-base mt-3 max-w-md leading-relaxed ${(series.video_url || series.cover_image_url) ? 'text-white/90' : 'text-muted-foreground'}`}>
              {series.description}
            </p>
          )}
        </div>
      </section>

      {/* Products */}
      <div className="container py-16 md:py-24">
        {products.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">
            Coming soon — pieces from this collection will appear shortly.
          </p>
        ) : (
          <>
            <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase mb-12 text-center">
              {products.length} {products.length === 1 ? 'piece' : 'pieces'}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
