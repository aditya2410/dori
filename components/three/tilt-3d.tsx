'use client'

import { useRef, type ReactNode } from 'react'
import { use3DSupport } from '@/lib/use-3d-support'

interface Tilt3DProps {
  children: ReactNode
  /** Max tilt angle in degrees (default 8). */
  max?: number
  /** Scale factor on hover (default 1.02). */
  scale?: number
  className?: string
}

/**
 * Lightweight CSS-3D tilt wrapper. Tracks the cursor inside the element
 * and applies a perspective rotation + a subtle highlight glare on top.
 *
 * Falls back to no-op (just renders children) when:
 *   • The device fails the 3D support check (low memory, reduced-motion,
 *     no WebGL, save-data, etc.)
 *   • Pointer device is coarse (touch) — handled via CSS @media below.
 *
 * Pure CSS transforms, no Three.js — keeps product grids fast.
 */
export function Tilt3D({ children, max = 8, scale = 1.02, className }: Tilt3DProps) {
  const supports3D = use3DSupport()
  const wrap = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const glare = useRef<HTMLDivElement>(null)

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!supports3D) return
    const el = wrap.current
    const i = inner.current
    const g = glare.current
    if (!el || !i) return
    const rect = el.getBoundingClientRect()
    const cx = (e.clientX - rect.left) / rect.width // 0..1
    const cy = (e.clientY - rect.top) / rect.height // 0..1
    const rx = (0.5 - cy) * max * 2
    const ry = (cx - 0.5) * max * 2
    i.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`
    if (g) {
      g.style.opacity = '1'
      g.style.background = `radial-gradient(circle at ${cx * 100}% ${cy * 100}%, rgba(255,255,255,0.35), transparent 55%)`
    }
  }

  function onLeave() {
    const i = inner.current
    const g = glare.current
    if (i) i.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)'
    if (g) g.style.opacity = '0'
  }

  // When 3D isn't supported, render children straight through.
  if (supports3D === false) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      ref={wrap}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={{ perspective: 900 }}
      data-testid="tilt-3d"
    >
      <div
        ref={inner}
        className="relative will-change-transform"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {children}
        {/* Specular glare layer — clipped to the child shape via inset-0 */}
        <div
          ref={glare}
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 mix-blend-overlay"
        />
      </div>
    </div>
  )
}
