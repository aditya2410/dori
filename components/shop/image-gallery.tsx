'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { BLUR_PLACEHOLDER } from '@/lib/utils'

interface ImageGalleryProps {
  images: string[]
  productName: string
}

const SNAP_EASING = 'transform 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
const ZOOM_SCALE  = 2.5

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [active, setActive]     = useState(0)
  const [zoomed, setZoomed]     = useState(false)
  const [origin, setOrigin]     = useState({ x: 50, y: 50 })

  const stripRef    = useRef<HTMLDivElement>(null)
  const activeRef   = useRef(0)
  const posRef      = useRef(0)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const isHoriz     = useRef<boolean | null>(null)

  function containerWidth() {
    return stripRef.current?.parentElement?.clientWidth ?? 0
  }

  function applyPos(p: number) {
    const max = (images.length - 1) * containerWidth()
    posRef.current = Math.max(0, Math.min(max, p))
    if (stripRef.current) {
      stripRef.current.style.transition = 'transform 0ms'
      stripRef.current.style.transform  = `translateX(-${posRef.current}px)`
    }
  }

  function snapTo(idx: number) {
    const el = stripRef.current
    if (!el) return
    const cw = containerWidth()
    posRef.current    = idx * cw
    activeRef.current = idx
    setActive(idx)
    setZoomed(false)
    requestAnimationFrame(() => {
      el.style.transition = SNAP_EASING
      el.style.transform  = `translateX(-${idx * cw}px)`
    })
  }

  function onTouchStart(e: React.TouchEvent) {
    if (zoomed) return          // let zoom handle its own touch
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isHoriz.current = null
  }

  function onTouchMove(e: React.TouchEvent) {
    if (zoomed || touchStartX.current === null || touchStartY.current === null) return
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
    if (zoomed || touchStartX.current === null || !isHoriz.current) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 40) { snapTo(activeRef.current); return }
    const next = delta < 0
      ? Math.min(activeRef.current + 1, images.length - 1)
      : Math.max(activeRef.current - 1, 0)
    snapTo(next)
    isHoriz.current = null
  }

  // Desktop: click to zoom/unzoom, mousemove to pan
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width)  * 100
    const y = ((e.clientY - rect.top)  / rect.height) * 100
    if (!zoomed) {
      setOrigin({ x, y })
      setZoomed(true)
    } else {
      setZoomed(false)
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!zoomed) return
    const rect = e.currentTarget.getBoundingClientRect()
    setOrigin({
      x: ((e.clientX - rect.left) / rect.width)  * 100,
      y: ((e.clientY - rect.top)  / rect.height) * 100,
    })
  }

  // Mobile tap: zoom in at tap point, tap again to exit
  function handleZoomTap(e: React.TouchEvent<HTMLDivElement>) {
    if (!zoomed) {
      const rect = e.currentTarget.getBoundingClientRect()
      const t = e.changedTouches[0]
      setOrigin({
        x: ((t.clientX - rect.left) / rect.width)  * 100,
        y: ((t.clientY - rect.top)  / rect.height) * 100,
      })
      setZoomed(true)
    } else {
      setZoomed(false)
    }
  }

  // Escape to close zoom
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setZoomed(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] bg-secondary flex items-center justify-center">
        <span className="font-serif text-3xl text-muted-foreground">DORI</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main frame */}
      <div
        className="aspect-[3/4] bg-secondary overflow-hidden relative"
        style={{
          touchAction: zoomed ? 'none' : 'pan-y',
          cursor: zoomed ? 'zoom-out' : 'zoom-in',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={zoomed ? handleZoomTap : onTouchEnd}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      >
        {/* Scrolling strip (hidden under zoom overlay when zoomed) */}
        <div
          ref={stripRef}
          className="flex h-full"
          style={{
            width: `${images.length * 100}%`,
            willChange: 'transform',
            visibility: zoomed ? 'hidden' : 'visible',
          }}
        >
          {images.map((url, i) => (
            <div key={url} className="relative h-full" style={{ width: `${100 / images.length}%` }}>
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

        {/* In-place zoom overlay — same frame, no modal */}
        {zoomed && (
          <div className="absolute inset-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[active]}
              alt={productName}
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
              draggable={false}
              style={{
                transform: `scale(${ZOOM_SCALE})`,
                transformOrigin: `${origin.x}% ${origin.y}%`,
                transition: 'transform-origin 0.05s linear',
              }}
            />
          </div>
        )}

        {/* Dot indicators — mobile, only when not zoomed */}
        {images.length > 1 && !zoomed && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 md:hidden pointer-events-none">
            {images.map((_, i) => (
              <span
                key={i}
                className={`size-1.5 rounded-full transition-colors duration-200 ${i === active ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        )}

        {/* Zoom hint — desktop */}
        {!zoomed && (
          <div className="absolute bottom-3 right-3 hidden md:flex items-center gap-1 bg-background/60 text-xs px-2 py-1 opacity-0 hover:opacity-0 group-hover:opacity-100 pointer-events-none select-none">
            Click to zoom
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
