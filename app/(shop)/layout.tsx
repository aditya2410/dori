import { SiteHeader } from '@/components/shop/site-header'
import { ShopLayoutClient } from './layout-client'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShopLayoutClient header={<SiteHeader />}>
      {children}
    </ShopLayoutClient>
  )
}
