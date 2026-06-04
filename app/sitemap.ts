import type { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const supabase = createServiceClient()

  const [{ data: products }, { data: series }] = await Promise.all([
    supabase.from('products').select('slug, updated_at').eq('is_active', true),
    supabase.from('series').select('slug, updated_at').eq('is_active', true),
  ])

  const productUrls: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${base}/products/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const collectionUrls: MetadataRoute.Sitemap = (series ?? []).map((s) => ({
    url: `${base}/collections/${s.slug}`,
    lastModified: new Date(s.updated_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const staticPages: MetadataRoute.Sitemap = [
    { url: base,                          changeFrequency: 'daily',   priority: 1.0 },
    { url: `${base}/products`,            changeFrequency: 'daily',   priority: 0.9 },
    { url: `${base}/collections`,         changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${base}/about`,               changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/contact`,             changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/shipping-policy`,     changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/refund-policy`,       changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/privacy-policy`,      changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/terms`,               changeFrequency: 'monthly', priority: 0.3 },
  ]

  return [...staticPages, ...productUrls, ...collectionUrls]
}
