import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/account/', '/checkout/', '/api/', '/cart/'],
      },
    ],
    sitemap: 'https://dorijaipur.in/sitemap.xml',
  }
}