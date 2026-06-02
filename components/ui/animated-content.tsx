'use client'

import { usePathname } from 'next/navigation'

/**
 * Wraps page content with a slide-in-from-left CSS animation.
 * key={pathname} forces React to remount this div on every navigation,
 * which replays the animation — no JavaScript animation libraries needed.
 */
export function AnimatedContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const pathname = usePathname()
  return (
    <div
      key={pathname}
      className={`animate-in slide-in-from-left-8 fade-in duration-500 ease-out ${className ?? ''}`}
    >
      {children}
    </div>
  )
}
