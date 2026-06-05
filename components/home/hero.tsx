import Image from 'next/image'
import Link from 'next/link'
import heroImg from '@/public/images/hero.webp'
import { heroConfig } from '@/lib/config'

export function Hero() {
  return (
    <section className="relative w-full aspect-[3/4] md:h-[calc(100vh-4rem)] overflow-hidden">
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

      {/* Gradient overlay — subtle darkening toward the bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />

      {/* Text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 md:justify-center md:pb-0 px-6 text-center">
        <h1 className="font-serif text-4xl md:text-6xl font-light tracking-tight text-white">
          {heroConfig.headline}
        </h1>
        <p className="font-sans text-sm md:text-base tracking-wide text-white/90 mt-4 max-w-md leading-relaxed">
          {heroConfig.subheadline}
        </p>
        <Link
          href={heroConfig.ctaHref}
          data-track="hero-cta"
          className="inline-block bg-white text-foreground text-xs tracking-[0.2em] px-10 py-4 mt-8 hover:bg-white/90 transition-colors"
        >
          {heroConfig.ctaText}
        </Link>
      </div>
    </section>
  )
}
