'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq?: (...args: any[]) => void
  }
}

/**
 * Loads the Meta Pixel (Instagram/Facebook ads) and re-fires PageView on
 * client-side navigations. Renders nothing unless NEXT_PUBLIC_META_PIXEL_ID
 * is set. Pair with the Conversions API route for server-side coverage.
 */
export function MetaPixel() {
  const pathname = usePathname()

  useEffect(() => {
    if (PIXEL_ID && typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView')
    }
  }, [pathname])

  if (!PIXEL_ID) return null

  return (
    <Script
      id="meta-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');`,
      }}
    />
  )
}

/**
 * Fire a standard event to both the browser Pixel and (via /api/meta/track) the
 * server-side Conversions API, sharing one event_id so Meta dedupes them.
 * No-op unless the Pixel is configured.
 */
export function trackMeta(
  eventName: string,
  customData: Record<string, unknown> = {},
  userData?: { email?: string; phone?: string },
): void {
  if (!PIXEL_ID || typeof window === 'undefined') return

  const eventId =
    window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`

  try {
    window.fbq?.('track', eventName, customData, { eventID: eventId })
  } catch {
    /* ignore */
  }

  try {
    fetch('/api/meta/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName,
        eventId,
        eventSourceUrl: window.location.href,
        customData,
        userData,
      }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* ignore */
  }
}
