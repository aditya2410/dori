'use client'

import { usePathname } from 'next/navigation'
import { AnimatedContent } from '@/components/ui/animated-content'
import { SiteFooter } from '@/components/shop/site-footer'

const CHROME_HIDDEN = ['/checkout']

export function ShopLayoutClient({
  header,
  children,
}: {
  header: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const showChrome = !CHROME_HIDDEN.some((p) => pathname === p || pathname.startsWith(p + '/'))

  return (
    <>
      {showChrome && header}
      <AnimatedContent>{children}</AnimatedContent>
      {showChrome && <SiteFooter />}
    </>
  )
}
