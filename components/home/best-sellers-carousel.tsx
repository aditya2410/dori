'use client'

import { useRef, useEffect } from 'react'
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
const DECAY      = 0.96  // momentum decay — higher = slower coast

export function BestSellersCarousel({ products }: { products: Product[] }) {
  // 3× products so we always have buffer in both directions
  const all = [...products, ...products, ...products]
  const REAL_WIDTH = products.length * (CARD_WIDTH + CARD_GAP)

  const stripRef  = useRef<HTMLDivElement>(null)
  const posRef    = useRef(REAL_WIDTH) // start in the middle set
  const velRef    = useRef(0)
  const rafRef    = useRef(0)
  const dragging  = useRef(false)
  const startX    = useRef(0)
  const startPos  = useRef(REAL_WIDTH)
  const lastX     = useRef(0)
  const lastTime  = useRef(0)

  // Place the strip at the middle set on mount
  useEffect(() => {
    if (stripRef.current) {
      stripRef.current.style.transform = `translateX(-${REAL_WIDTH}px)`
    }
  }, [REAL_WIDTH])

  function applyPos(p: number) {
    // Normalise: when pos drifts outside the middle set range, jump by REAL_WIDTH
    let norm = p
    if (norm > REAL_WIDTH * 1.5) norm -= REAL_WIDTH
    if (norm < REAL_WIDTH * 0.5) norm += REAL_WIDTH
    posRef.current = norm
    if (stripRef.current) {
      stripRef.current.style.transition = 'transform 0ms'
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

  // ── Touch ─────────────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    cancelAnimationFrame(rafRef.current)
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
    startMomentum()
  }

  // ── Mouse drag (desktop) ──────────────────────────────────
  function onMouseDown(e: React.MouseEvent) {
    cancelAnimationFrame(rafRef.current)
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

  return (
    <div
      className="overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{ touchAction: 'pan-y' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
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
  )
}
