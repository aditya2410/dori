import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Providers } from './providers'
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'DORI — Handcrafted Luxury Goods',
    template: '%s | DORI',
  },
  description: 'Handcrafted luxury goods, thoughtfully made. Slow craft, considered living.',
  openGraph: {
    type: 'website',
    siteName: 'DORI',
    title: 'DORI — Handcrafted Luxury Goods',
    description: 'Handcrafted luxury goods, thoughtfully made.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DORI — Handcrafted Luxury Goods',
    description: 'Handcrafted luxury goods, thoughtfully made.',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
