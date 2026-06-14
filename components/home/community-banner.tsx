'use client'

import { useRef, useEffect } from 'react'

interface Photo { id: string; url: string }

const PHOTO_SIZE = 280   // px — width = height (square)
const PHOTO_GAP  = 16    // px between photos
const SPEED      = 1     // px per frame ≈ 60px/sec at 60fps

export function CommunityBanner({ photos }: { photos: Photo[] }) {
  const stripRef = useRef<HTMLDivElement>(null)
  const posRef   = useRef(0)
  const rafRef   = useRef(0)

  const all = [...photos, ...photos, ...photos] // 3× for seamless loop
  const REAL_WIDTH = photos.length * (PHOTO_SIZE + PHOTO_GAP)

  useEffect(() => {
    if (photos.length === 0) return
    const strip = stripRef.current
    if (!strip) return

    function tick() {
      posRef.current += SPEED
      if (posRef.current >= REAL_WIDTH) posRef.current -= REAL_WIDTH
      if (strip) strip.style.transform = `translateX(-${posRef.current}px)`
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [photos.length, REAL_WIDTH])

  if (photos.length === 0) return null

  return (
    <section className="py-16 md:py-24 overflow-hidden">
      {/* Heading */}
      <div className="container text-center mb-10 space-y-2">
        <p className="font-sans text-xs tracking-[0.3em] text-muted-foreground uppercase">
          The Dori Family
        </p>
        <h2 className="font-serif text-3xl md:text-5xl font-light">
          Worn with love
        </h2>
      </div>

      {/* Scrolling strip */}
      <div className="relative">
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-background to-transparent z-10" />

        <div
          ref={stripRef}
          className="flex"
          style={{
            gap: `${PHOTO_GAP}px`,
            willChange: 'transform',
          }}
        >
          {all.map((photo, i) => (
            <div
              key={`${photo.id}-${i}`}
              className="shrink-0 overflow-hidden bg-secondary"
              style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt="Dori family"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
