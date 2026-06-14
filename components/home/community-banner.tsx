'use client'

import { useRef, useEffect } from 'react'

interface Photo { id: string; url: string }

const PHOTO_SIZE = 280
const PHOTO_GAP  = 16
const SPEED      = 1      // auto-scroll px/frame
const DECAY      = 0.95   // momentum decay after drag release

export function CommunityBanner({ photos }: { photos: Photo[] }) {
  const stripRef  = useRef<HTMLDivElement>(null)
  const posRef    = useRef(0)
  const velRef    = useRef(0)
  const rafRef    = useRef(0)
  const dragging  = useRef(false)
  const startX    = useRef(0)
  const startPos  = useRef(0)
  const lastX     = useRef(0)
  const lastTime  = useRef(0)

  const all = [...photos, ...photos, ...photos]
  const REAL_WIDTH = photos.length * (PHOTO_SIZE + PHOTO_GAP)

  function applyPos(p: number) {
    let norm = p
    if (norm > REAL_WIDTH * 1.5) norm -= REAL_WIDTH
    if (norm < REAL_WIDTH * 0.5) norm += REAL_WIDTH
    posRef.current = norm
    if (stripRef.current) {
      stripRef.current.style.transform = `translateX(-${norm}px)`
    }
  }

  useEffect(() => {
    if (photos.length === 0) return
    const strip = stripRef.current
    if (!strip) return

    // Start from middle set
    posRef.current = REAL_WIDTH
    strip.style.transform = `translateX(-${REAL_WIDTH}px)`

    function tick() {
      if (!dragging.current) {
        if (Math.abs(velRef.current) > 0.3) {
          // Momentum after drag
          velRef.current *= DECAY
          applyPos(posRef.current + velRef.current)
        } else {
          // Resume auto-scroll
          velRef.current = 0
          applyPos(posRef.current + SPEED)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [photos.length, REAL_WIDTH])

  // ── Touch ─────────────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    dragging.current = true
    startX.current   = e.touches[0].clientX
    startPos.current = posRef.current
    lastX.current    = startX.current
    lastTime.current = Date.now()
    velRef.current   = 0
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return
    const now = Date.now()
    const dx  = e.touches[0].clientX - lastX.current
    const dt  = Math.max(1, now - lastTime.current)
    velRef.current = (-dx / dt) * 16
    lastX.current  = e.touches[0].clientX
    lastTime.current = now
    applyPos(startPos.current - (e.touches[0].clientX - startX.current))
  }

  function onTouchEnd() {
    dragging.current = false
  }

  // ── Mouse ─────────────────────────────────────────────────
  function onMouseDown(e: React.MouseEvent) {
    dragging.current = true
    startX.current   = e.clientX
    startPos.current = posRef.current
    lastX.current    = e.clientX
    lastTime.current = Date.now()
    velRef.current   = 0
    e.preventDefault()
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging.current) return
      const now = Date.now()
      const dx  = e.clientX - lastX.current
      const dt  = Math.max(1, now - lastTime.current)
      velRef.current = (-dx / dt) * 16
      lastX.current  = e.clientX
      lastTime.current = now
      applyPos(startPos.current - (e.clientX - startX.current))
    }
    function onMouseUp() { dragging.current = false }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  if (photos.length === 0) return null

  return (
    <section className="py-16 md:py-24 overflow-hidden">
      <div className="container text-center mb-10 space-y-2">
        <p className="font-sans text-xs tracking-[0.3em] text-muted-foreground uppercase">
          The Dori Family
        </p>
        <h2 className="font-serif text-3xl md:text-5xl font-light">
          Worn with love
        </h2>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-background to-transparent z-10" />

        <div
          className="cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'pan-y' }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
        >
          <div
            ref={stripRef}
            className="flex"
            style={{ gap: `${PHOTO_GAP}px`, willChange: 'transform' }}
          >
            {all.map((photo, i) => (
              <div
                key={`${photo.id}-${i}`}
                className="shrink-0 overflow-hidden bg-secondary"
                style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="Dori family" className="h-full w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
