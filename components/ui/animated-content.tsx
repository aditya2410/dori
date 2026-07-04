'use client'

import { usePathname } from 'next/navigation'

/**
 * Wraps page content with a soft fade-in on navigation — no directional slide,
 * to match the calm, elegant redesign. key={pathname} remounts this div on every
 * navigation, replaying the fade; no JavaScript animation libraries needed.
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
      className={`animate-in fade-in duration-500 ease-out ${className ?? ''}`}
    >
      {children}
    </div>
  )
}
