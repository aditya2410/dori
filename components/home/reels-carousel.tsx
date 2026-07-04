'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { Play } from 'lucide-react'

export interface ReelItem {
  id: string
  videoUrl: string
  poster?: string
  href: string
  external: boolean
  label: string
  track: string
}

const CARD_W = 176
const CARD_H = 264
const GAP = 16
const SPEED = 0.6 // auto-scroll px/frame
const DECAY = 0.95 // momentum decay after drag release
const DRAG_THRESHOLD = 6 // px moved before a press counts as a drag (suppresses click)

// Only auto-scroll once the row would actually overflow / feel sparse otherwise.
const MIN_DESKTOP = 6 // > 6 reels on desktop
const MIN_MOBILE = 3 // > 3 reels on mobile

function ReelCard({ reel, index }: { reel: ReelItem; index: number }) {
  const inner = (
    <div className="relative overflow-hidden bg-secondary" style={{ width: CARD_W, height: CARD_H }}>
      <video
        src={reel.videoUrl}
        poster={reel.poster}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        className="h-full w-full object-cover"
      />
      <span className="pointer-events-none absolute inset-0 bg-black/20" />
      <Play
        aria-hidden
        className="pointer-events-none absolute right-2.5 top-2.5 size-3.5 fill-white text-white drop-shadow"
      />
      <span className="pointer-events-none absolute bottom-2.5 left-2.5 right-2.5 text-[11px] font-semibold text-white drop-shadow">
        {reel.label}
      </span>
    </div>
  )
  return reel.external ? (
    <a
      key={`${reel.id}-${index}`}
      href={reel.href}
      target="_blank"
      rel="noopener noreferrer"
      data-track={reel.track}
      draggable={false}
      className="shrink-0"
    >
      {inner}
    </a>
  ) : (
    <Link
      key={`${reel.id}-${index}`}
      href={reel.href}
      data-track={reel.track}
      draggable={false}
      className="shrink-0"
    >
      {inner}
    </Link>
  )
}

/**
 * "Shop our reels" row. Auto-slides (Dori-Family-style marquee) only when there
 * are enough reels to warrant it — more than 6 on desktop, more than 3 on
 * mobile — otherwise it's a plain, manually-scrollable row. The shoppable cards
 * pause the marquee on hover and a drag doesn't fire the link.
 */
export function ReelsCarousel({ reels }: { reels: ReelItem[] }) {
  const stripRef = useRef<HTMLDivElement>(null)
  const posRef = useRef(0)
  const velRef = useRef(0)
  const rafRef = useRef(0)
  const dragging = useRef(false)
  const moved = useRef(false)
  const paused = useRef(false)
  const startX = useRef(0)
  const startPos = useRef(0)
  const lastX = useRef(0)
  const lastTime = useRef(0)

  // Decide auto-scroll from viewport + count (recomputed on resize).
  const [autoScroll, setAutoScroll] = useState(false)
  useEffect(() => {
    function compute() {
      const isDesktop = window.matchMedia('(min-width: 768px)').matches
      setAutoScroll(reels.length > (isDesktop ? MIN_DESKTOP : MIN_MOBILE))
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [reels.length])

  const all = [...reels, ...reels, ...reels]
  const REAL_WIDTH = reels.length * (CARD_W + GAP)

  function applyPos(p: number) {
    let norm = p
    if (norm > REAL_WIDTH * 1.5) norm -= REAL_WIDTH
    if (norm < REAL_WIDTH * 0.5) norm += REAL_WIDTH
    posRef.current = norm
    if (stripRef.current) stripRef.current.style.transform = `translateX(-${norm}px)`
  }

  useEffect(() => {
    if (!autoScroll || reels.length === 0) return
    const strip = stripRef.current
    if (!strip) return

    // Start from the middle set so it can scroll both ways seamlessly.
    posRef.current = REAL_WIDTH
    strip.style.transform = `translateX(-${REAL_WIDTH}px)`

    function tick() {
      if (!dragging.current && !paused.current) {
        if (Math.abs(velRef.current) > 0.3) {
          velRef.current *= DECAY
          applyPos(posRef.current + velRef.current)
        } else {
          velRef.current = 0
          applyPos(posRef.current + SPEED)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoScroll, REAL_WIDTH])

  // ── Touch ─────────────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    dragging.current = true
    moved.current = false
    startX.current = e.touches[0].clientX
    startPos.current = posRef.current
    lastX.current = startX.current
    lastTime.current = Date.now()
    velRef.current = 0
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return
    const now = Date.now()
    const dx = e.touches[0].clientX - lastX.current
    const dt = Math.max(1, now - lastTime.current)
    velRef.current = (-dx / dt) * 16
    lastX.current = e.touches[0].clientX
    lastTime.current = now
    const delta = e.touches[0].clientX - startX.current
    if (Math.abs(delta) > DRAG_THRESHOLD) moved.current = true
    applyPos(startPos.current - delta)
  }
  function onTouchEnd() {
    dragging.current = false
  }

  // ── Mouse ─────────────────────────────────────────────────
  function onMouseDown(e: React.MouseEvent) {
    dragging.current = true
    moved.current = false
    startX.current = e.clientX
    startPos.current = posRef.current
    lastX.current = e.clientX
    lastTime.current = Date.now()
    velRef.current = 0
    e.preventDefault()
  }
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging.current) return
      const now = Date.now()
      const dx = e.clientX - lastX.current
      const dt = Math.max(1, now - lastTime.current)
      velRef.current = (-dx / dt) * 16
      lastX.current = e.clientX
      lastTime.current = now
      const delta = e.clientX - startX.current
      if (Math.abs(delta) > DRAG_THRESHOLD) moved.current = true
      applyPos(startPos.current - delta)
    }
    function onMouseUp() {
      dragging.current = false
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  // A drag ending on a card must not navigate.
  function onClickCapture(e: React.MouseEvent) {
    if (moved.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  if (reels.length === 0) return null

  // Not enough reels to auto-scroll — plain, manually-scrollable row.
  if (!autoScroll) {
    return (
      <div className="flex gap-4 overflow-x-auto px-4 md:px-8 pb-2 md:justify-center [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {reels.map((reel, i) => (
          <ReelCard key={reel.id} reel={reel} index={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-background to-transparent md:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background to-transparent md:w-24" />

      <div
        className="cursor-grab select-none active:cursor-grabbing"
        style={{ touchAction: 'pan-y' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseEnter={() => (paused.current = true)}
        onMouseLeave={() => (paused.current = false)}
        onClickCapture={onClickCapture}
      >
        <div ref={stripRef} className="flex" style={{ gap: `${GAP}px`, willChange: 'transform' }}>
          {all.map((reel, i) => (
            <ReelCard key={`${reel.id}-${i}`} reel={reel} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
