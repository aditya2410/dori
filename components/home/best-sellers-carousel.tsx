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

const CARD_WIDTH  = 260  // px per card
const CARD_GAP    = 24   // px between cards
const DECAY       = 0.96 // momentum decay per frame — higher = slower coast

export function BestSellersCarousel({ products }: { products: Product[] }) {
  const stripRef    = useRef<HTMLDivElement>(null)
  const posRef      = useRef(0)       // current translateX offset (positive = scrolled right)
  const maxRef      = useRef(0)       // max scrollable distance
  const velRef      = useRef(0)       // current velocity px/frame
  const rafRef      = useRef<number>(0)
  const dragging    = useRef(false)
  const startX      = useRef(0)
  const startPos    = useRef(0)
  const lastX       = useRef(0)
  const lastTime    = useRef(0)

  // Compute max scroll after mount
  useEffect(() => {
    const container = stripRef.current?.parentElement
    if (!container || !stripRef.current) return
    const totalWidth = products.length * CARD_WIDTH + (products.length - 1) * CARD_GAP
    maxRef.current = Math.max(0, totalWidth - container.clientWidth)
  }, [products.length])

  function setPos(p: number, animated = false) {
    const clamped = Math.max(0, Math.min(maxRef.current, p))
    posRef.current = clamped
    if (stripRef.current) {
      stripRef.current.style.transition = animated
        ? 'transform 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        : 'transform 0ms'
      stripRef.current.style.transform = `translateX(-${clamped}px)`
    }
  }

  function startMomentum() {
    cancelAnimationFrame(rafRef.current!)
    function frame() {
      velRef.current *= DECAY
      if (Math.abs(velRef.current) < 0.3) return
      setPos(posRef.current + velRef.current)
      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)
  }

  // ── Touch ──────────────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    cancelAnimationFrame(rafRef.current!)
    dragging.current = true
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
    velRef.current = -dx / dt * 16 // convert to px/frame at ~60fps
    lastX.current = e.touches[0].clientX
    lastTime.current = now
    setPos(startPos.current - (e.touches[0].clientX - startX.current))
  }

  function onTouchEnd() {
    dragging.current = false
    startMomentum()
  }

  // ── Mouse (desktop drag) ───────────────────────────────────
  function onMouseDown(e: React.MouseEvent) {
    cancelAnimationFrame(rafRef.current!)
    dragging.current = true
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
      velRef.current = -dx / dt * 16
      lastX.current = e.clientX
      lastTime.current = now
      setPos(startPos.current - (e.clientX - startX.current))
    }
    function onMouseUp() {
      if (!dragging.current) return
      dragging.current = false
      startMomentum()
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
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
        style={{
          gap: `${CARD_GAP}px`,
          willChange: 'transform',
        }}
      >
        {products.map((product) => (
          <div key={product.id} style={{ width: `${CARD_WIDTH}px`, flexShrink: 0 }}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  )
}
