import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import Script from 'next/script'
import { Providers } from './providers'
import { MetaPixel } from '@/components/analytics/meta-pixel'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const SITE_URL = 'https://dorijaipur.in'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: '/' },
  title: {
    default: 'Dori Jaipur — Handcrafted Luxury Accessories',
    template: '%s | Dori Jaipur',
  },
  description:
    'Shop handcrafted luxury bags, keychains and embroidered shirts by Dori Jaipur. Made by skilled artisans in Jaipur, India using traditional techniques passed down through generations.',
  openGraph: {
    type: 'website',
    siteName: 'Dori Jaipur',
    title: 'Dori Jaipur — Handcrafted Luxury Accessories',
    description:
      'Shop handcrafted luxury bags, keychains and embroidered shirts by Dori Jaipur. Made by artisans in Jaipur, India.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dori Jaipur — Handcrafted Luxury Accessories',
    description:
      'Shop handcrafted luxury bags, keychains and embroidered shirts by Dori Jaipur. Made by artisans in Jaipur, India.',
  },
  robots: { index: true, follow: true },
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Dori Jaipur',
  alternateName: 'DORI',
  url: SITE_URL,
  description:
    'Handcrafted luxury bags, keychains and embroidered shirts made by artisans in Jaipur, India.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body>
        <MetaPixel />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
