'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import heroImg from '@/public/images/hero.webp'
import { heroConfig } from '@/lib/config'
import { use3DSupport } from '@/lib/use-3d-support'

// R3F + three.js are heavy. Load only on the client, only when needed.
const Hero3DScene = dynamic(
  () => import('./hero-3d-scene').then((m) => m.Hero3DScene),
  { ssr: false }
)

/**
 * 3D hero with graceful 2D fallback.
 *
 * Architecture:
 *   • The 2D <Image/> is ALWAYS rendered as the base layer. It's the
 *     SSR-safe, always-correct visual ground truth.
 *   • If the device supports WebGL, a transparent <Canvas/> is layered
 *     on top to add the ripple + parallax + dust particles.
 *   • If anything in the 3D path fails, errors, or the device doesn't
 *     support it, the user still sees the perfect 2D hero underneath.
 *
 * Copy, CTA, and brand layering are preserved verbatim from the 2D hero.
 */
export function Hero3D() {
  const supports3D = use3DSupport()

  return (
    <section
      data-testid="hero-section"
      className="relative w-full h-svh min-h-[640px] overflow-hidden bg-[#1a1614]"
    >
      {/* Base layer: 2D hero image — always rendered for SSR & fallback. */}
      <Image
        src={heroImg}
        alt={heroConfig.headline}
        fill
        sizes="100vw"
        quality={90}
        priority
        placeholder="blur"
        className="object-cover object-center"
      />

      {/* 3D enhancement layer: mounted only when the device can handle it.
          The canvas is transparent so the 2D image shows through if any
          part of the scene fails to render. */}
      {supports3D && (
        <div className="absolute inset-0" data-testid="hero-3d-canvas">
          <Hero3DScene imageSrc={heroConfig.image} />
        </div>
      )}

      {/* Gradient overlay — subtle darkening toward the bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 pointer-events-none" />

      {/* Text overlay — identical copy to the original 2D hero */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 md:justify-center md:pb-0 px-6 text-center z-10">
        <h1 className="font-serif text-4xl md:text-6xl font-light tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
          {heroConfig.headline}
        </h1>
        <p className="font-sans text-sm md:text-base tracking-wide text-white/90 mt-4 max-w-md leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
          {heroConfig.subheadline}
        </p>
        <Link
          href={heroConfig.ctaHref}
          data-track="hero-cta"
          data-testid="hero-cta"
          className="inline-block bg-white text-foreground text-xs tracking-[0.2em] px-10 py-4 mt-8 hover:bg-white/90 transition-colors"
        >
          {heroConfig.ctaText}
        </Link>
      </div>
    </section>
  )
}
