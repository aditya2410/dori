'use client'

import NextTopLoader from 'nextjs-toploader'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { CartProvider } from '@/contexts/cart'
import { AnalyticsProvider } from '@/components/analytics-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <NextTopLoader
        color="#1a1a1a"
        height={2}
        showSpinner={false}
        easing="ease"
        speed={200}
        shadow={false}
      />
      <AnalyticsProvider>
        {children}
      </AnalyticsProvider>
      {/* Vercel Analytics — automatic page views + Web Vitals */}
      <Analytics />
      <SpeedInsights />
    </CartProvider>
  )
}
