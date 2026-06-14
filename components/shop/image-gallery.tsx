'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { X, ZoomIn } from 'lucide-react'
import { BLUR_PLACEHOLDER } from '@/lib/utils'

interface ImageGalleryProps {
  images: string[]
  productName: string
}

const SNAP_EASING = 'transform 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'

// ── Zoom modal ────────────────────────────────────────────────
function ZoomModal({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 p-2 bg-background/80 hover:bg-secondary transition-colors rounded-full"
        onClick={onClose}
        aria-label="Close zoom"
      >
        <X className="size-5" />
      </button>
      {/* Inner div stops click propagation so clicking the image doesn't close */}
      <div
        className="relative w-full h-full max-w-2xl max-h-[90vh] m-4 overflow-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ touchAction: 'pinch-zoom' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain select-none"
          draggable={false}
        />
      </div>
    </div>
  )
}

// ── Gallery ───────────────────────────────────────────────────
export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [active, setActive] = useState(0)
  const [zoomedSrc, setZoomedSrc] = useState<string | null>(null)

  const stripRef    = useRef<HTMLDivElement>(null)
  const activeRef   = useRef(0)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const isHoriz     = useRef<boolean | null>(null)

  useEffect(() => {
    if (stripRef.current) {
      stripRef.current.style.transform = `translateX(0px)`
    }
  }, [])

  function applyPos(p: number) {
    posRef.current = Math.max(0, Math.min((images.length - 1) * containerWidth(), p))
    if (stripRef.current) {
      stripRef.current.style.transition = 'transform 0ms'
      stripRef.current.style.transform  = `translateX(-${posRef.current}px)`
    }
  }

  function snapTo(idx: number) {
    const el = stripRef.current
    if (!el) return
    const cw = el.parentElement?.clientWidth ?? 0
    posRef.current = idx * cw
    activeRef.current = idx
    setActive(idx)
    requestAnimationFrame(() => {
      el.style.transition = SNAP_EASING
      el.style.transform  = `translateX(-${idx * cw}px)`
    })
  }

  const posRef = useRef(0)

  function containerWidth() {
    return stripRef.current?.parentElement?.clientWidth ?? 0
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isHoriz.current = null
  }

  function onTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current
    if (isHoriz.current === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      isHoriz.current = Math.abs(dx) > Math.abs(dy)
    }
    if (!isHoriz.current) return
    const atStart = activeRef.current === 0 && dx > 0
    const atEnd   = activeRef.current === images.length - 1 && dx < 0
    if (!atStart && !atEnd) applyPos(activeRef.current * containerWidth() - dx)
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || !isHoriz.current) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 40) {
      snapTo(activeRef.current)
      return
    }
    const next = delta < 0
      ? Math.min(activeRef.current + 1, images.length - 1)
      : Math.max(activeRef.current - 1, 0)
    snapTo(next)
    isHoriz.current = null
  }

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] bg-secondary flex items-center justify-center">
        <span className="font-serif text-3xl text-muted-foreground">DORI</span>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {/* Main strip */}
        <div
          className="aspect-[3/4] bg-secondary overflow-hidden relative group"
          style={{ touchAction: 'pan-y' }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            ref={stripRef}
            className="flex h-full"
            style={{ width: `${images.length * 100}%` }}
          >
            {images.map((url, i) => (
              <div
                key={url}
                className="relative h-full cursor-zoom-in"
                style={{ width: `${100 / images.length}%` }}
                onClick={() => setZoomedSrc(url)}
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

          {/* Zoom hint — desktop only */}
          <div className="absolute bottom-3 right-3 hidden md:flex items-center gap-1 bg-background/70 text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <ZoomIn className="size-3" />
            Click to zoom
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
                  className={`size-1.5 rounded-full transition-colors duration-200 ${i === active ? 'bg-white' : 'bg-white/40'}`}
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
                className={`aspect-square bg-secondary overflow-hidden relative border-2 transition-colors ${active === i ? 'border-foreground' : 'border-transparent hover:border-foreground/30'}`}
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

      {/* Zoom modal */}
      {zoomedSrc && (
        <ZoomModal
          src={zoomedSrc}
          alt={productName}
          onClose={() => setZoomedSrc(null)}
        />
      )}
    </>
  )
}
