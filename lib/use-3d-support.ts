'use client'

import { useEffect, useState } from 'react'

/**
 * Detects whether the current device can comfortably run a real-time
 * WebGL scene. Falls back to 2D when:
 *   • WebGL / WebGL2 is unavailable
 *   • The user prefers reduced motion
 *   • The device reports low memory (≤ 2 GB) — typical low-end mobiles
 *   • The hardware concurrency is too low (≤ 2 cores)
 *   • Running over data-saver
 *
 * Returns `null` while detecting (so the page can show a neutral 2D
 * placeholder during SSR / first paint), then `true` or `false`.
 */
export function use3DSupport(): boolean | null {
  const [supported, setSupported] = useState<boolean | null>(null)

  useEffect(() => {
    // Always client-side from here.
    try {
      // 1. Prefer reduced motion → 2D.
      if (typeof window !== 'undefined' && window.matchMedia) {
        const rm = window.matchMedia('(prefers-reduced-motion: reduce)')
        if (rm.matches) {
          setSupported(false)
          return
        }
      }

      // 2. WebGL availability.
      const canvas = document.createElement('canvas')
      const gl =
        canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')
      if (!gl) {
        setSupported(false)
        return
      }

      // 3. Low-memory devices (Chrome/Edge expose deviceMemory in GB).
      const nav = navigator as Navigator & {
        deviceMemory?: number
        connection?: { saveData?: boolean; effectiveType?: string }
      }
      if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2) {
        setSupported(false)
        return
      }

      // 4. Very low concurrency (older mobiles).
      if (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 2) {
        setSupported(false)
        return
      }

      // 5. Save-data or 2G connections.
      if (nav.connection?.saveData) {
        setSupported(false)
        return
      }
      if (nav.connection?.effectiveType && /(^slow-2g$|^2g$)/.test(nav.connection.effectiveType)) {
        setSupported(false)
        return
      }

      setSupported(true)
    } catch {
      setSupported(false)
    }
  }, [])

  return supported
}
