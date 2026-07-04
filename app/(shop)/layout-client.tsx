'use client'

import { usePathname } from 'next/navigation'
import { AnimatedContent } from '@/components/ui/animated-content'
import { SiteFooter } from '@/components/shop/site-footer'
import { ExitIntentFeedback } from '@/components/feedback/exit-intent-feedback'

const CHROME_HIDDEN = ['/checkout']
// Product pages end at the "See more love" DM section — no footer to scroll into.
const FOOTER_HIDDEN_PREFIXES = ['/products/']

export function ShopLayoutClient({
  header,
  children,
}: {
  header: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const showChrome = !CHROME_HIDDEN.some((p) => pathname === p || pathname.startsWith(p + '/'))
  const showFooter =
    showChrome && !FOOTER_HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))

  return (
    <>
      {showChrome && header}
      <AnimatedContent>{children}</AnimatedContent>
      {showFooter && <SiteFooter />}
      <ExitIntentFeedback />
    </>
  )
}
