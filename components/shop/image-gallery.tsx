'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { BLUR_PLACEHOLDER } from '@/lib/utils'

interface ImageGalleryProps {
  images: string[]
  productName: string
  videoUrl?: string | null
  videoPosition?: number | null
}

type Media =
  | { type: 'image'; url: string }
  | { type: 'video'; url: string }

// Big centered play button; native controls appear once playing.
function GalleryVideo({ url }: { url: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  return (
    <div className="relative h-full w-full">
      <video
        ref={ref}
        src={url}
        playsInline
        controls={playing}
        className="h-full w-full object-cover bg-secondary"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {!playing && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); ref.current?.play() }}
          className="absolute inset-0 flex items-center justify-center bg-black/20"
          aria-label="Play video"
        >
          <span className="flex items-center justify-center size-16 rounded-full bg-white/90 shadow-lg">
            <Play className="size-7 text-black fill-black ml-1" />
          </span>
        </button>
      )}
    </div>
  )
}

const SNAP_EASING  = 'transform 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
const ZOOM_SNAP    = 'transform 0.3s ease'
const MAX_SCALE    = 4
const SNAP_THRESHOLD = 1.15   // below this, snap back to 1

// ── helpers ───────────────────────────────────────────────────
type Pt = { clientX: number; clientY: number }
function dist(t1: Pt, t2: Pt) {
  return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
}
function mid(t1: Pt, t2: Pt) {
  return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 }
}
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export function ImageGallery({ images, productName, videoUrl, videoPosition }: ImageGalleryProps) {
  // Photos in order, with the video inserted at videoPosition (default: last).
  const media: Media[] = images.map((url) => ({ type: 'image' as const, url }))
  if (videoUrl) {
    const pos = videoPosition ?? media.length
    media.splice(Math.min(Math.max(pos, 0), media.length), 0, { type: 'video', url: videoUrl })
  }
  const isImageActive = (i: number) => media[i]?.type === 'image'

  const [active, setActive]   = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const isZoomedRef = useRef(false)   // readable from non-passive native handlers

  // Strip refs (swipe between images)
  const stripRef  = useRef<HTMLDivElement>(null)
  const activeRef = useRef(0)
  const posRef    = useRef(0)

  // Zoom refs (pinch / pan state — all via refs for 60fps)
  const zoomRef   = useRef<HTMLImageElement>(null)
  const scaleRef  = useRef(1)
  const panXRef   = useRef(0)
  const panYRef   = useRef(0)
  // Touch tracking
  const touch1    = useRef<{ clientX: number; clientY: number } | null>(null)
  const touch2    = useRef<{ clientX: number; clientY: number } | null>(null)
  const startDist = useRef(0)
  const startScale = useRef(1)
  const startPanX = useRef(0)
  const startPanY = useRef(0)
  const startMid  = useRef({ x: 0, y: 0 })
  const swipeStartX = useRef<number | null>(null)
  const swipeStartY = useRef<number | null>(null)
  const isHoriz   = useRef<boolean | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  function containerSize() {
    const el = containerRef.current
    return el ? { w: el.clientWidth, h: el.clientHeight } : { w: 0, h: 0 }
  }

  // Apply zoom transform directly to the overlay image
  function applyZoom(s: number, tx: number, ty: number, animated = false) {
    const el = zoomRef.current
    if (!el) return
    el.style.transition = animated ? ZOOM_SNAP : 'none'
    el.style.transform  = `translate(${tx}px, ${ty}px) scale(${s})`
    scaleRef.current = s
    panXRef.current  = tx
    panYRef.current  = ty
  }

  function clampPan(s: number, tx: number, ty: number) {
    const { w, h } = containerSize()
    return {
      tx: clamp(tx, w * (1 - s), 0),
      ty: clamp(ty, h * (1 - s), 0),
    }
  }

  function snapBack() {
    const { tx, ty } = clampPan(1, 0, 0)
    applyZoom(1, tx, ty, true)
    isZoomedRef.current = false
    setTimeout(() => setIsZoomed(false), 300)
  }

  // ── Strip swipe (when not zoomed) ─────────────────────────
  function cw() { return stripRef.current?.parentElement?.clientWidth ?? 0 }

  function applyStrip(p: number) {
    const max = (media.length - 1) * cw()
    posRef.current = clamp(p, 0, max)
    if (stripRef.current) {
      stripRef.current.style.transition = 'none'
      stripRef.current.style.transform  = `translateX(-${posRef.current}px)`
    }
  }

  function snapStrip(idx: number) {
    const el = stripRef.current; if (!el) return
    const w = cw()
    posRef.current    = idx * w
    activeRef.current = idx
    setActive(idx)
    requestAnimationFrame(() => {
      el.style.transition = SNAP_EASING
      el.style.transform  = `translateX(-${idx * w}px)`
    })
  }

  // ── Touch handler ──────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    const touches = e.touches

    if (touches.length === 2) {
      // Begin pinch — images only; the video slide isn't zoomable
      if (!isImageActive(activeRef.current)) return
      touch1.current = { clientX: touches[0].clientX, clientY: touches[0].clientY }
      touch2.current = { clientX: touches[1].clientX, clientY: touches[1].clientY }
      startDist.current  = dist(touches[0], touches[1])
      startScale.current = scaleRef.current
      startPanX.current  = panXRef.current
      startPanY.current  = panYRef.current
      const m = mid(touches[0], touches[1])
      const rect = containerRef.current!.getBoundingClientRect()
      startMid.current = { x: m.x - rect.left, y: m.y - rect.top }
      if (!isZoomedRef.current) { isZoomedRef.current = true; setIsZoomed(true) }
      return
    }

    if (touches.length === 1) {
      if (isZoomed) {
        // Begin pan
        startPanX.current = panXRef.current
        startPanY.current = panYRef.current
        swipeStartX.current = touches[0].clientX
        swipeStartY.current = touches[0].clientY
      } else {
        // Begin swipe
        swipeStartX.current = touches[0].clientX
        swipeStartY.current = touches[0].clientY
        isHoriz.current = null
      }
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    const touches = e.touches

    if (touches.length === 2 && startDist.current > 0) {
      e.preventDefault()
      const newDist  = dist(touches[0], touches[1])
      const newScale = clamp(startScale.current * (newDist / startDist.current), 1, MAX_SCALE)
      const rect     = containerRef.current!.getBoundingClientRect()
      const m        = mid(touches[0], touches[1])
      const cx       = m.x - rect.left
      const cy       = m.y - rect.top
      const ratio    = newScale / startScale.current

      // Keep pinch midpoint stationary (transform-origin 0,0 math)
      let tx = cx - (startMid.current.x - startPanX.current) * ratio
      let ty = cy - (startMid.current.y - startPanY.current) * ratio
      ;({ tx, ty } = clampPan(newScale, tx, ty))
      applyZoom(newScale, tx, ty)
      return
    }

    if (touches.length === 1) {
      const dx = touches[0].clientX - (swipeStartX.current ?? touches[0].clientX)
      const dy = touches[0].clientY - (swipeStartY.current ?? touches[0].clientY)

      if (isZoomed) {
        // Pan the zoomed image
        const { tx, ty } = clampPan(scaleRef.current, startPanX.current + dx, startPanY.current + dy)
        applyZoom(scaleRef.current, tx, ty)
        return
      }

      // Swipe between images
      if (isHoriz.current === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        isHoriz.current = Math.abs(dx) > Math.abs(dy)
      }
      if (!isHoriz.current) return
      const cur = activeRef.current
      const atStart = cur === 0 && dx > 0
      const atEnd   = cur === media.length - 1 && dx < 0
      if (!atStart && !atEnd) applyStrip(cur * cw() - dx)
    }
  }

  function onTouchEnd(e: React.TouchEvent) {
    // Pinch end
    if (touch2.current) {
      touch1.current = null
      touch2.current = null
      startDist.current = 0
      if (scaleRef.current < SNAP_THRESHOLD) {
        snapBack()
      }
      return
    }

    if (isZoomed) return   // pan end — nothing to do

    // Swipe end
    if (swipeStartX.current === null || !isHoriz.current) {
      swipeStartX.current = null
      return
    }
    const delta = e.changedTouches[0].clientX - swipeStartX.current
    swipeStartX.current = null
    if (Math.abs(delta) < 40) { snapStrip(activeRef.current); return }
    const next = delta < 0
      ? Math.min(activeRef.current + 1, media.length - 1)
      : Math.max(activeRef.current - 1, 0)
    snapStrip(next)
    isHoriz.current = null
  }

  // ── Desktop: click to zoom/unzoom, mousemove to pan ───────
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (isZoomed) { snapBack(); return }
    // Don't hijack clicks on the video slide — let its native controls work
    if (!isImageActive(active)) return
    const rect = e.currentTarget.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const s  = 2.5
    const { tx, ty } = clampPan(s, -cx * (s - 1), -cy * (s - 1))
    isZoomedRef.current = true
    setIsZoomed(true)
    requestAnimationFrame(() => applyZoom(s, tx, ty, true))
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isZoomed) return
    const rect = e.currentTarget.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const s  = scaleRef.current
    const { tx, ty } = clampPan(s, -cx * (s - 1), -cy * (s - 1))
    applyZoom(s, tx, ty)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && isZoomed) snapBack() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isZoomed])

  // Prevent browser viewport pan/zoom during pinch or while zoomed.
  // Must be non-passive so preventDefault() is honoured.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    function block(e: TouchEvent) {
      if (e.touches.length >= 2 || isZoomedRef.current) e.preventDefault()
    }
    el.addEventListener('touchstart', block, { passive: false })
    el.addEventListener('touchmove',  block, { passive: false })
    return () => {
      el.removeEventListener('touchstart', block)
      el.removeEventListener('touchmove',  block)
    }
  }, [])

  if (media.length === 0) {
    return (
      <div className="aspect-[3/4] bg-secondary flex items-center justify-center">
        <span className="font-serif text-3xl text-muted-foreground">DORI</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="aspect-[3/4] bg-secondary overflow-hidden relative"
        style={{
          touchAction: isZoomed ? 'none' : 'pan-y',
          cursor: isZoomed ? 'zoom-out' : 'zoom-in',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      >
        {/* Swipeable strip (hidden while zoomed) */}
        <div
          ref={stripRef}
          className="flex h-full"
          style={{
            width: `${media.length * 100}%`,
            willChange: 'transform',
            visibility: isZoomed ? 'hidden' : 'visible',
          }}
        >
          {media.map((item, i) => (
            <div key={item.url} className="relative h-full" style={{ width: `${100 / media.length}%` }}>
              {item.type === 'image' ? (
                <Image
                  src={item.url}
                  alt={`${productName} — ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                  className="object-cover"
                  priority={i === 0}
                />
              ) : (
                <GalleryVideo url={item.url} />
              )}
            </div>
          ))}
        </div>

        {/* Zoom overlay — always mounted so the img stays loaded; hidden when inactive */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ visibility: isZoomed ? 'visible' : 'hidden' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={zoomRef}
            src={isImageActive(active) ? media[active].url : ''}
            alt={productName}
            draggable={false}
            className="absolute top-0 left-0 w-full h-full object-cover select-none pointer-events-none"
            style={{ transformOrigin: '0 0' }}
          />
        </div>

        {/* Dots — mobile, not zoomed */}
        {media.length > 1 && !isZoomed && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 md:hidden pointer-events-none">
            {media.map((_, i) => (
              <span key={i} className={`size-1.5 rounded-full transition-colors duration-200 ${i === active ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        )}

        {/* Zoom hint — desktop */}
        {!isZoomed && (
          <div className="absolute bottom-3 right-3 hidden md:block bg-background/60 text-xs px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none select-none">
            Click to zoom
          </div>
        )}
      </div>

      {/* Thumbnails — desktop */}
      {media.length > 1 && (
        <div className="hidden md:grid grid-cols-4 gap-2">
          {media.map((item, i) => (
            <button
              key={item.url}
              type="button"
              onClick={() => snapStrip(i)}
              aria-label={item.type === 'video' ? 'View video' : `View image ${i + 1}`}
              className={`aspect-square bg-secondary overflow-hidden relative border-2 transition-colors ${active === i ? 'border-foreground' : 'border-transparent hover:border-foreground/30'}`}
            >
              {item.type === 'image' ? (
                <Image
                  src={item.url}
                  alt={`${productName} — view ${i + 1}`}
                  fill
                  sizes="10vw"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                  className="object-cover"
                />
              ) : (
                <>
                  <video
                    src={item.url}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play className="size-5 text-white fill-white" />
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
