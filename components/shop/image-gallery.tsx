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
  const touchStartX = useRef<number | null>(null)

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] bg-secondary flex items-center justify-center">
        <span className="font-serif text-3xl text-muted-foreground">DORI</span>
      </div>
    )
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null

    if (Math.abs(delta) < 40) return // ignore taps
    if (delta < 0) {
      // swipe left → next
      setActive((prev) => Math.min(prev + 1, images.length - 1))
    } else {
      // swipe right → previous
      setActive((prev) => Math.max(prev - 1, 0))
    }
  }

  return (
    <div className="space-y-3">
      {/* Main image — swipeable on touch */}
      <div
        className="aspect-[3/4] bg-secondary overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={images[active]}
          alt={productName}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          className="object-cover transition-opacity duration-300"
          priority
        />

        {/* Dot indicators on mobile */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 md:hidden">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Go to image ${i + 1}`}
                className={`size-1.5 rounded-full transition-colors ${
                  i === active ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails — desktop only */}
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
