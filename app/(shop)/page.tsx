import type { Metadata } from 'next'
import { Hero3D } from '@/components/three/hero-3d'
import { BestSellers } from '@/components/home/best-sellers'
import { CommunityBanner } from '@/components/home/community-banner'
import { CraftSection } from '@/components/home/craft-section'
import { MarqueeWords } from '@/components/home/marquee-words'
import { Reveal } from '@/components/reveal'
import { ScrollTilt3D } from '@/components/scroll-tilt-3d'
import { createServiceClient } from '@/lib/supabase/server'

export const revalidate = 600

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  title: 'Dori Jaipur — Handcrafted Luxury Bags & Accessories',
  description:
    'Dori Jaipur — handcrafted luxury bags and accessories made in Jaipur. Shop pearl bags, beaded clutches, crystal handbags and handmade keychains. Ships across India.',
}

/**
 * Pick the first image from a product row's `images` JSON column.
 */
function firstImageOf(row: { name: string | null; images: unknown } | null | undefined): {
  url: string
  name: string
} | null {
  if (!row) return null
  const imgs = Array.isArray(row.images) ? (row.images as string[]) : []
  if (!imgs.length) return null
  return { url: imgs[0], name: row.name ?? 'Dori piece' }
}

export default async function HomePage() {
  const supabase = createServiceClient()

  const [community, featured] = await Promise.all([
    supabase
      .from('community_photos')
      .select('id, url')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
    // Pick a featured product for the Craft section centerpiece —
    // prefer a bestseller, fall back to any active product.
    supabase
      .from('products')
      .select('name, images')
      .eq('is_active', true)
      .eq('is_bestseller', true)
      .order('bestseller_order', { ascending: true, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
  ])

  let craftFeatured = firstImageOf(featured.data)
  if (!craftFeatured) {
    const { data: any1 } = await supabase
      .from('products')
      .select('name, images')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    craftFeatured = firstImageOf(any1)
  }

  return (
    <>
      <Hero3D />

      <MarqueeWords />

      {craftFeatured && (
        <CraftSection
          productImage={craftFeatured.url}
          productName={craftFeatured.name}
        />
      )}

      <ScrollTilt3D intensity={6} direction="both">
        <Reveal effect="up">
          <BestSellers />
        </Reveal>
      </ScrollTilt3D>

      <ScrollTilt3D intensity={5} direction="both">
        <Reveal effect="scale">
          <CommunityBanner photos={community.data ?? []} />
        </Reveal>
      </ScrollTilt3D>
    </>
  )
}
