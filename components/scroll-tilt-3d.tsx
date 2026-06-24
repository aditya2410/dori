'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { use3DSupport } from '@/lib/use-3d-support'

/**
 * Wraps any section in a scroll-driven 3D perspective transform.
 * As the section enters and leaves the viewport, it rotates on the
 * X axis (and slightly on Y based on the cursor), giving the page a
 * single, cohesive "everything is on a 3D plane" feel.
 *
 * Uses CSS transforms only — no extra library, no layout thrash.
 *
 * Falls back to no-op on devices that failed the 3D support check.
 */
interface ScrollTilt3DProps {
  children: ReactNode
  /** Peak tilt angle in degrees (default 8). */
  intensity?: number
  /** Direction of the tilt curve: 'in' tilts as it enters,
   *  'out' as it leaves, 'both' (default) for a full arc. */
  direction?: 'in' | 'out' | 'both'
  className?: string
}

export function ScrollTilt3D({
  children,
  intensity = 8,
  direction = 'both',
  className,
}: ScrollTilt3DProps) {
  const supports3D = use3DSupport()
  const ref = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const cursor = useRef({ x: 0 })
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(supports3D === true)
  }, [supports3D])

  useEffect(() => {
    if (!enabled) {
      // Reset transform when disabled.
      const el = inner.current
      if (el) el.style.transform = ''
      return
    }
    let raf = 0

    function frame() {
      const root = ref.current
      const el = inner.current
      if (root && el) {
        const rect = root.getBoundingClientRect()
        const vh = window.innerHeight
        // -1 (just entered from below) → 0 (centered) → +1 (leaving up)
        const center = rect.top + rect.height / 2
        const t = Math.max(-1, Math.min(1, (vh / 2 - center) / (vh / 2)))

        let rx: number
        if (direction === 'in') rx = (1 - Math.max(0, -t)) * -intensity
        else if (direction === 'out') rx = Math.max(0, t) * -intensity
        else rx = -t * intensity

        const ry = cursor.current.x * (intensity * 0.5)
        el.style.transform = `perspective(1400px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`
      }
      raf = requestAnimationFrame(frame)
    }
    function onMouse(e: MouseEvent) {
      cursor.current.x = (e.clientX / window.innerWidth - 0.5) * 2 // -1..1
    }
    window.addEventListener('mousemove', onMouse, { passive: true })
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [enabled, intensity, direction])

  return (
    <div
      ref={ref}
      className={className}
      style={{ perspective: 1400, perspectiveOrigin: '50% 50%' }}
    >
      <div
        ref={inner}
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: enabled ? 'transform' : undefined,
        }}
      >
        {children}
      </div>
    </div>
  )
}
