'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { track } from '@/lib/tracking'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const prevPath = useRef<string | null>(null)

  // ── Page view tracking ──────────────────────────────────────
  useEffect(() => {
    if (pathname === prevPath.current) return
    prevPath.current = pathname
    track('page_view', { path: pathname })
  }, [pathname])

  // ── Global click tracking ───────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      const el = target.closest('a, button, [data-track]') as HTMLElement | null
      if (!el) return

      const label =
        el.getAttribute('data-track') ??
        el.getAttribute('aria-label') ??
        el.textContent?.trim().slice(0, 60) ??
        el.tagName.toLowerCase()

      const href = (el as HTMLAnchorElement).href ?? null

      track('click', {
        label,
        tag: el.tagName.toLowerCase(),
        ...(href ? { href } : {}),
      })
    }

    document.addEventListener('click', handleClick, { capture: true, passive: true })
    return () => document.removeEventListener('click', handleClick, { capture: true })
  }, [])

  return <>{children}</>
}
