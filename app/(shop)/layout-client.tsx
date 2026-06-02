'use client'

import { usePathname } from 'next/navigation'
import { AnimatedContent } from '@/components/ui/animated-content'

// Server Components can be passed as props to Client Components.
// This lets us conditionally render SiteHeader based on pathname
// without making the layout itself a Client Component.
const HEADERLESS = ['/checkout']

export function ShopLayoutClient({
  header,
  children,
}: {
  header: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const showHeader = !HEADERLESS.some((p) => pathname === p || pathname.startsWith(p + '/'))

  return (
    <>
      {showHeader && header}
      <AnimatedContent>{children}</AnimatedContent>
    </>
  )
}
