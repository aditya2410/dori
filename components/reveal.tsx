'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Scroll-reveal wrapper. Detects when the element enters the viewport
 * and adds a `data-visible="true"` attribute that drives a CSS
 * transition (defined in globals.css → .reveal-up / .reveal-fade /
 * .reveal-scale).
 *
 * Falls back gracefully: if IntersectionObserver isn't available the
 * element renders fully visible immediately.
 */
type Effect = 'up' | 'fade' | 'scale' | 'right' | 'left'

interface RevealProps {
  children: ReactNode
  /** Animation effect (default 'up'). */
  effect?: Effect
  /** Delay before animating, in ms. */
  delay?: number
  /** Trigger threshold 0..1 (default 0.15). */
  threshold?: number
  /** Animate once, then leave it visible (default true). */
  once?: boolean
  className?: string
  as?: 'div' | 'section' | 'article' | 'span'
}

export function Reveal({
  children,
  effect = 'up',
  delay = 0,
  threshold = 0.15,
  once = true,
  className = '',
  as = 'div',
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (once) io.disconnect()
        } else if (!once) {
          setVisible(false)
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [once, threshold])

  const Tag = as as 'div'
  return (
    <Tag
      // @ts-expect-error generic tag ref
      ref={ref}
      data-visible={visible || undefined}
      data-reveal={effect}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined }}
      className={`reveal ${className}`}
    >
      {children}
    </Tag>
  )
}
