'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { BLUR_PLACEHOLDER } from '@/lib/utils'

interface ImageGalleryProps {
  images: string[]
  productName: string
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [active, setActive] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const isHorizontal = useRef<boolean | null>(null)

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] bg-secondary flex items-center justify-center">
        <span className="font-serif text-3xl text-muted-foreground">DORI</span>
      </div>
    )
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isHorizontal.current = null
    setIsDragging(true)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current

    // Lock direction on first significant movement
    if (isHorizontal.current === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      isHorizontal.current = Math.abs(dx) > Math.abs(dy)
    }

    if (isHorizontal.current) {
      setDragOffset(dx)
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    touchStartY.current = null
    setIsDragging(false)
    setDragOffset(0)

    if (!isHorizontal.current || Math.abs(delta) < 40) return
    if (delta < 0) setActive((p) => Math.min(p + 1, images.length - 1))
    else setActive((p) => Math.max(p - 1, 0))
    isHorizontal.current = null
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
          className="flex h-full"
          style={{
            width: `${images.length * 100}%`,
            transform: `translateX(calc(-${(active / images.length) * 100}% + ${dragOffset / images.length}px))`,
            transition: isDragging ? 'none' : 'transform 380ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            willChange: 'transform',
          }}
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
                onClick={() => setActive(i)}
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
              onClick={() => setActive(i)}
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
