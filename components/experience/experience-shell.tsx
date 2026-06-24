'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { detectTier, type TierResult } from '@/lib/device-tier'
import { ShowroomLoading } from './showroom-loading'
import type { ExperienceQuote } from '@/lib/experience-content'

export type ExperienceProduct = {
  slug: string
  name: string
  /** Pre-formatted on the server (e.g. "₹3,899") — no client-side Intl. */
  priceLabel: string
  texture: string
}

// The WebGL bundle (three + r3f + drei ≈ 0.6-1MB) lives behind this dynamic
// import. ssr:false keeps it off the server render entirely; it only loads
// AFTER detectTier() clears a device. The `loading` state never blocks the page
// because we render the static grid until the canvas is ready.
const ExperienceCanvas = dynamic(
  () => import('./experience-canvas').then((m) => m.ExperienceCanvas),
  {
    ssr: false,
    // Branded loader while the 3D chunk downloads, so a qualified device never
    // flashes blank between leaving the grid and the canvas mounting.
    loading: () => (
      <div className="relative h-[calc(100svh-3.5rem)] md:h-[calc(100svh-4rem)] w-full">
        <ShowroomLoading />
      </div>
    ),
  },
)

export function ExperienceShell({
  products,
  quotes,
}: {
  products: ExperienceProduct[]
  quotes: ExperienceQuote[]
}) {
  // Starts false on the server AND first client paint → everyone (crawlers,
  // no-JS, low-end, reduced-motion) gets the static grid. We only upgrade to 3D
  // after a capability probe on a qualified device.
  const [tier, setTier] = useState<TierResult | null>(null)

  useEffect(() => {
    // Testing overrides: ?force3d=1 mounts the canvas regardless of the gate,
    // ?force2d=1 forces the fallback. Lets us verify either path on any device
    // (e.g. with macOS Reduce Motion on) without changing system settings.
    const q = new URLSearchParams(window.location.search)
    let t = detectTier()
    if (q.has('force3d')) t = { canRender3D: true, reason: 'ok' }
    else if (q.has('force2d')) t = { canRender3D: false, reason: t.reason }
    setTier(t)
    // Dev-only: explain why a device got 2D vs 3D (e.g. "reduced-motion").
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[experience] tier: ${t.canRender3D ? '3D' : '2D fallback'} — reason: ${t.reason}`)
    }
  }, [])

  const show3D = tier?.canRender3D && products.length > 0

  return (
    <div className="relative">
      {show3D ? (
        <ExperienceCanvas products={products} quotes={quotes} />
      ) : (
        <StaticGallery products={products} quotes={quotes} probing={tier === null} />
      )}
    </div>
  )
}

/**
 * The crawlable, no-WebGL fallback. This is also the server-rendered markup, so
 * Google and no-JS clients always get real product links here. Plain <img> with
 * the pre-baked WebP variant — intentionally NOT next/image (avoids the Vercel
 * optimizer quota; the variant is already ~1024px WebP).
 */
function StaticGallery({
  products,
  quotes,
  probing,
}: {
  products: ExperienceProduct[]
  quotes: ExperienceQuote[]
  probing: boolean
}) {
  const intro = quotes[0]
  return (
    <section className="container py-12 md:py-20">
      <header className="text-center space-y-3 mb-12 md:mb-16">
        <p className="font-sans text-xs tracking-[0.3em] text-muted-foreground uppercase">
          The Showroom
        </p>
        <h1 className="font-serif text-3xl md:text-5xl font-light">
          {intro?.text ?? 'Dori Jaipur'}
        </h1>
        {intro?.attribution && (
          <p className="font-sans text-sm text-muted-foreground">{intro.attribution}</p>
        )}
        {/* Tiny, unobtrusive hint while the capability probe runs (one frame). */}
        {probing && (
          <p className="sr-only" aria-live="polite">
            Preparing the immersive showroom…
          </p>
        )}
      </header>

      <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
        {products.map((p) => (
          <li key={p.slug}>
            <Link href={`/products/${p.slug}`} className="group block" data-track="experience-product">
              <div className="aspect-[3/4] overflow-hidden bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.texture}
                  alt={p.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="mt-3 space-y-1">
                <h2 className="font-serif text-base font-normal leading-snug">{p.name}</h2>
                <p className="text-sm text-muted-foreground">{p.priceLabel}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
