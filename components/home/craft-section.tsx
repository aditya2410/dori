'use client'

import { useRef, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Reveal } from '@/components/reveal'
import { use3DSupport } from '@/lib/use-3d-support'

const CraftPearl = dynamic(() => import('./craft-pearl').then((m) => m.CraftPearl), { ssr: false })

interface CraftSectionProps {
  /** Featured product image URL (e.g. first bestseller's cover photo) */
  productImage: string
  /** Display name of the featured product */
  productName: string
}

const LINES = [
  'A single pearl',
  'becomes a knot,',
  'becomes a thread,',
  'becomes a bag',
  'that outlasts us.',
]

export function CraftSection({ productImage, productName }: CraftSectionProps) {
  const supports3D = use3DSupport()
  const ref = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function onScroll() {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
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

  // Bias the curve so the first line lights up early and the last
  // line completes well before progress hits 1.0 (the tail of the
  // section is just the gradient hand-off, not active scroll content).
  const eased = Math.min(1, Math.max(0, (progress - 0.05) / 0.55))
  const activeIndex = Math.min(LINES.length - 1, Math.floor(eased * LINES.length))

  return (
    <section
      ref={ref}
      data-testid="craft-section"
      className="relative bg-[#13100e] text-[#f5e6c4] overflow-hidden"
      style={{ minHeight: '180vh' }}
    >
      <div className="sticky top-0 h-svh flex items-center justify-center">
        {/* 3D pearl-and-product centerpiece */}
        <div className="absolute inset-0">
          {supports3D ? (
            <CraftPearl
              progress={progress}
              productImage={productImage}
              productName={productName}
            />
          ) : (
            // 2D fallback: the same product photo with a warm halo.
            <div className="absolute inset-0 flex items-center justify-center md:justify-start md:pl-[10%]">
              <div className="relative size-[60vmin] max-w-[440px]">
                <div
                  aria-hidden
                  className="absolute -inset-8 rounded-full"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 50%, rgba(245,230,196,0.35) 0%, rgba(202,164,114,0.15) 45%, transparent 70%)',
                    filter: 'blur(8px)',
                  }}
                />
                <div className="relative aspect-[3/4] overflow-hidden rounded-sm">
                  <Image
                    src={productImage}
                    alt={productName}
                    fill
                    sizes="60vmin"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
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

export { Reveal }
