import type { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/server'

const BASE = 'https://dorijaipur.in'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient()

  const [{ data: products }, { data: series }] = await Promise.all([
    supabase
      .from('products')
      .select('slug, created_at')
      .eq('is_active', true),          // hidden + deleted products excluded
    supabase
      .from('series')
      .select('slug, updated_at')
      .eq('is_active', true),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                              changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/products`,                changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/collections`,             changeFrequency: 'weekly',  priority: 0.7 },
    // Immersive 3D showroom — indexable but low priority; the 2D product pages
    // remain the canonical destination for crawling and checkout.
    { url: `${BASE}/experience`,              changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/about`,                   changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/contact`,                 changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/shipping-policy`,         changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/refund-policy`,           changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/privacy-policy`,          changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/terms`,                   changeFrequency: 'monthly', priority: 0.3 },
  ]

  const productUrls: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${BASE}/products/${p.slug}`,
    lastModified: new Date(p.created_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const collectionUrls: MetadataRoute.Sitemap = (series ?? []).map((s) => ({
    url: `${BASE}/collections/${s.slug}`,
    lastModified: new Date(s.updated_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticPages, ...productUrls, ...collectionUrls]
}
