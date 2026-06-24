'use client'

import { useRef, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Reveal } from '@/components/reveal'
import { use3DSupport } from '@/lib/use-3d-support'

const CraftPearl = dynamic(() => import('./craft-pearl').then((m) => m.CraftPearl), { ssr: false })

/**
 * Scroll-pinned 3D section. As the user scrolls through it, a giant
 * pearl rotates and a typographic story reveals line by line. The
 * background subtly darkens to give the section its own emotional
 * register, separate from the warm cream of the rest of the page.
 *
 * Pure scroll-progress driven (no GSAP / motion library).
 */
const LINES = [
  'A single pearl',
  'becomes a knot,',
  'becomes a thread,',
  'becomes a bag',
  'that outlasts us.',
]

export function CraftSection() {
  const supports3D = use3DSupport()
  const ref = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0) // 0..1

  useEffect(() => {
    function onScroll() {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      // Track from when the section's top hits the bottom (start)
      // to when its bottom hits the top (end).
      const total = rect.height + vh
      const passed = vh - rect.top
      setProgress(Math.max(0, Math.min(1, passed / total)))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  // Map progress to per-line opacity, revealing each in turn.
  const activeIndex = Math.min(LINES.length - 1, Math.floor(progress * (LINES.length + 0.5)))

  return (
    <section
      ref={ref}
      data-testid="craft-section"
      className="relative bg-[#13100e] text-[#f5e6c4] overflow-hidden"
      style={{ minHeight: '180vh' }}
    >
      {/* Sticky stage */}
      <div className="sticky top-0 h-svh flex items-center justify-center">
        {/* 3D pearl on the left half (desktop) */}
        <div className="absolute inset-0">
          {supports3D ? (
            <CraftPearl progress={progress} />
          ) : (
            // 2D fallback: a stylised radial gold halo
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[60vmin] rounded-full"
              style={{
                background:
                  'radial-gradient(circle at 35% 35%, #fff5e1 0%, #e9d8a6 28%, #caa472 52%, transparent 70%)',
                filter: 'blur(2px)',
              }}
            />
          )}
        </div>

        {/* Type — staggered reveal driven by scroll progress */}
        <div className="relative z-10 px-6 text-center md:text-left md:ml-[55%] md:max-w-md">
          <p className="font-sans text-xs tracking-[0.3em] uppercase opacity-70 mb-6">
            The Craft
          </p>
          {LINES.map((line, i) => (
            <p
              key={i}
              className="font-serif text-3xl md:text-5xl font-light leading-tight transition-all duration-700"
              style={{
                opacity: i <= activeIndex ? 1 : 0.15,
                transform: `translateY(${i <= activeIndex ? 0 : 16}px)`,
                transitionDelay: `${i * 60}ms`,
              }}
            >
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* Bottom seam — subtle warm gradient hand-off into the next section */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-b from-transparent to-[hsl(40_20%_97%)] pointer-events-none" />
    </section>
  )
}

// Re-export Reveal so home page can import everything from one entry.
export { Reveal }
