'use client'

import { useRef, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from '@/components/shop/product-card'

interface Product {
  id: string
  slug: string
  name: string
  price_paise: number
  images: unknown
}

const CARD_WIDTH = 260
const CARD_GAP   = 24
const DECAY      = 0.96
const STEP       = CARD_WIDTH + CARD_GAP   // one card per arrow click
const DRAG_THRESHOLD = 6                   // px — below this = click, not drag

export function BestSellersCarousel({ products }: { products: Product[] }) {
  const all = [...products, ...products, ...products]
  const REAL_WIDTH = products.length * (CARD_WIDTH + CARD_GAP)

  const stripRef   = useRef<HTMLDivElement>(null)
  const posRef     = useRef(REAL_WIDTH)
  const velRef     = useRef(0)
  const rafRef     = useRef(0)
  const dragging   = useRef(false)
  const wasDragged = useRef(false)   // did the pointer actually move?
  const startX     = useRef(0)
  const startPos   = useRef(REAL_WIDTH)
  const lastX      = useRef(0)
  const lastTime   = useRef(0)

  useEffect(() => {
    if (stripRef.current) {
      stripRef.current.style.transform = `translateX(-${REAL_WIDTH}px)`
    }
  }, [REAL_WIDTH])

  function applyPos(p: number) {
    let norm = p
    if (norm > REAL_WIDTH * 1.5) norm -= REAL_WIDTH
    if (norm < REAL_WIDTH * 0.5) norm += REAL_WIDTH
    posRef.current = norm
    if (stripRef.current) {
      stripRef.current.style.transition = 'transform 0ms'
      stripRef.current.style.transform  = `translateX(-${norm}px)`
    }
  }

  function snapTo(target: number) {
    let norm = target
    if (norm > REAL_WIDTH * 1.5) norm -= REAL_WIDTH
    if (norm < REAL_WIDTH * 0.5) norm += REAL_WIDTH
    posRef.current = norm
    if (stripRef.current) {
      stripRef.current.style.transition = 'transform 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      stripRef.current.style.transform  = `translateX(-${norm}px)`
    }
  }

  function startMomentum() {
    cancelAnimationFrame(rafRef.current)
    function frame() {
      velRef.current *= DECAY
      if (Math.abs(velRef.current) < 0.3) return
      applyPos(posRef.current + velRef.current)
      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)
  }

  function prev() {
    cancelAnimationFrame(rafRef.current)
    velRef.current = 0
    snapTo(posRef.current - STEP)
  }

  function next() {
    cancelAnimationFrame(rafRef.current)
    velRef.current = 0
    snapTo(posRef.current + STEP)
  }

  // ── Touch ────────────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    cancelAnimationFrame(rafRef.current)
    dragging.current  = true
    wasDragged.current = false
    startX.current    = e.touches[0].clientX
    startPos.current  = posRef.current
    lastX.current     = startX.current
    lastTime.current  = Date.now()
    velRef.current    = 0
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
    startMomentum()
  }

  // ── Mouse drag ───────────────────────────────────────────
  function onMouseDown(e: React.MouseEvent) {
    cancelAnimationFrame(rafRef.current)
    dragging.current   = true
    wasDragged.current = false
    startX.current     = e.clientX
    startPos.current   = posRef.current
    lastX.current      = e.clientX
    lastTime.current   = Date.now()
    velRef.current     = 0
    e.preventDefault()
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging.current) return
      const dx = e.clientX - startX.current
      if (Math.abs(dx) > DRAG_THRESHOLD) wasDragged.current = true

      const now = Date.now()
      const ddx = e.clientX - lastX.current
      const dt  = Math.max(1, now - lastTime.current)
      velRef.current = (-ddx / dt) * 16
      lastX.current  = e.clientX
      lastTime.current = now
      applyPos(startPos.current - (e.clientX - startX.current))
    }
    function onMouseUp() {
      if (!dragging.current) return
      dragging.current = false
      startMomentum()
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
    }
  }, [])

  // Block clicks that were actually drags
  function onClickCapture(e: React.MouseEvent) {
    if (wasDragged.current) {
      e.preventDefault()
      e.stopPropagation()
      wasDragged.current = false
    }
  }

  return (
    <div className="relative">
      {/* Prev / Next — desktop only */}
      <button
        onClick={prev}
        aria-label="Previous"
        data-track="bestsellers-prev"
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 size-9 items-center justify-center rounded-full bg-background border border-border shadow-sm hover:bg-secondary transition-colors"
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        onClick={next}
        aria-label="Next"
        data-track="bestsellers-next"
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 size-9 items-center justify-center rounded-full bg-background border border-border shadow-sm hover:bg-secondary transition-colors"
      >
        <ChevronRight className="size-4" />
      </button>

      <div
        className="overflow-hidden cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: 'pan-y' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onClickCapture={onClickCapture}
      >
        <div
          ref={stripRef}
          className="flex"
          style={{ gap: `${CARD_GAP}px`, willChange: 'transform' }}
        >
          {all.map((product, i) => (
            <div key={`${product.id}-${i}`} style={{ width: `${CARD_WIDTH}px`, flexShrink: 0 }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
