import { SiteHeader } from '@/components/shop/site-header'
import { SaleBanner } from '@/components/home/sale-banner'
import { BreakBanner } from '@/components/home/break-banner'
import { ShopLayoutClient } from './layout-client'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Store-on-break notice — auto-hides after the return date */}
      <BreakBanner />
      {/* Site-wide announcement bar — shows only when a sale is live */}
      <SaleBanner />
      <ShopLayoutClient header={<SiteHeader />}>
        {children}
      </ShopLayoutClient>
    </>
  )
}
