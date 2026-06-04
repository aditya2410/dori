'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { BLUR_PLACEHOLDER } from '@/lib/utils'

interface ImageGalleryProps {
  images: string[]
  productName: string
}

const SNAP_EASING = 'transform 380ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  // React state only for dots + thumbnails — NOT for the transform
  const [active, setActive] = useState(0)

  const stripRef  = useRef<HTMLDivElement>(null)
  const activeRef = useRef(0)           // mirrors active without stale closure
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const isHoriz = useRef<boolean | null>(null)

  // ── Direct DOM helpers ──────────────────────────────────────
  function setTransform(idx: number, offset: number) {
    const el = stripRef.current
    if (!el) return
    el.style.transition = 'transform 0ms'
    el.style.transform  = `translateX(calc(-${(idx / images.length) * 100}% + ${offset}px))`
  }

  function snapTo(idx: number) {
    const el = stripRef.current
    if (!el) return
    // rAF ensures the browser has committed the current position
    // before we enable the transition and change to the target
    requestAnimationFrame(() => {
      el.style.transition = SNAP_EASING
      el.style.transform  = `translateX(-${(idx / images.length) * 100}%)`
    })
    activeRef.current = idx
    setActive(idx)
  }

  // ── Touch handlers ──────────────────────────────────────────
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isHoriz.current = null
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current

    if (isHoriz.current === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      isHoriz.current = Math.abs(dx) > Math.abs(dy)
    }

    if (!isHoriz.current) return

    const cur = activeRef.current
    const atStart = cur === 0 && dx > 0
    const atEnd   = cur === images.length - 1 && dx < 0
    if (!atStart && !atEnd) setTransform(cur, dx)
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    touchStartY.current = null

    if (!isHoriz.current) return
    isHoriz.current = null

    const cur = activeRef.current
    if (Math.abs(delta) < 40) {
      snapTo(cur) // snap back to current
      return
    }

    const next = delta < 0
      ? Math.min(cur + 1, images.length - 1)
      : Math.max(cur - 1, 0)
    snapTo(next)
  }

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] bg-secondary flex items-center justify-center">
        <span className="font-serif text-3xl text-muted-foreground">DORI</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main strip */}
      <div
        className="aspect-[3/4] bg-secondary overflow-hidden relative"
        style={{ touchAction: 'pan-y' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={stripRef}
          className="flex h-full"
          style={{ width: `${images.length * 100}%` }}
        >
          {images.map((url, i) => (
            <div
              key={url}
              className="relative h-full"
              style={{ width: `${100 / images.length}%` }}
            >
              <Image
                src={url}
                alt={`${productName} — ${i + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
                className="object-cover"
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {/* Dot indicators — mobile */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 md:hidden">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => snapTo(i)}
                aria-label={`Go to image ${i + 1}`}
                className={`size-1.5 rounded-full transition-colors duration-200 ${
                  i === active ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails — desktop */}
      {images.length > 1 && (
        <div className="hidden md:grid grid-cols-4 gap-2">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => snapTo(i)}
              aria-label={`View image ${i + 1}`}
              className={`aspect-square bg-secondary overflow-hidden relative border-2 transition-colors ${
                active === i ? 'border-foreground' : 'border-transparent hover:border-foreground/30'
              }`}
            >
              <Image
                src={url}
                alt={`${productName} — view ${i + 1}`}
                fill
                sizes="10vw"
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
