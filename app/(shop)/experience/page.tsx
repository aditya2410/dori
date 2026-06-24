import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { textureUrl } from '@/lib/textures'
import { experienceQuotes } from '@/lib/experience-content'
import { ExperienceShell, type ExperienceProduct } from '@/components/experience/experience-shell'

// Same ISR cadence as the rest of the storefront. The heavy <Canvas> is
// client-only (ssr:false) and code-split — this page itself stays a light,
// crawlable Server Component, exactly like best-sellers.tsx.
export const revalidate = 3600

export const metadata: Metadata = {
  alternates: { canonical: '/experience' },
  title: 'The Showroom — An Immersive Walk Through Dori Jaipur',
  description:
    'Step inside the Dori Jaipur showroom — an immersive 3D gallery of our handcrafted pearl bags, beaded clutches and crystal handbags. Tap any piece to shop.',
}

export default async function ExperiencePage() {
  // Reuse the exact bestsellers query pattern from components/home/best-sellers.tsx.
  const { data: bestsellers } = await createServiceClient()
    .from('products')
    .select('id, slug, name, price_paise, images')
    .eq('is_bestseller', true)
    .eq('is_active', true)
    .order('bestseller_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(8) // hard cap on GPU-resident textures for this scene

  const products: ExperienceProduct[] = (bestsellers ?? [])
    .map((p) => {
      const images = Array.isArray(p.images) ? (p.images as string[]) : []
      const original = images[0]
      if (!original) return null
      return {
        slug: p.slug,
        name: p.name,
        // Format on the server and ship the string — running Intl in the client
        // grid would risk an iOS-vs-Node locale hydration mismatch.
        priceLabel: formatPrice(p.price_paise),
        // Pre-baked 1024px WebP variant — never the multi-MB original.
        texture: textureUrl(original),
      }
    })
    .filter((p): p is ExperienceProduct => p !== null)

  return <ExperienceShell products={products} quotes={experienceQuotes} />
}
