import type { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { data: products } = await createServiceClient()
    .from('products')
    .select('slug, created_at')
    .eq('is_active', true)

  const productUrls: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${base}/products/${p.slug}`,
    lastModified: new Date(p.created_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    { url: base,                  lastModified: new Date(), changeFrequency: 'daily',  priority: 1.0 },
    { url: `${base}/products`,    lastModified: new Date(), changeFrequency: 'daily',  priority: 0.9 },
    ...productUrls,
  ]
}
