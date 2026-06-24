'use client'

import dynamic from 'next/dynamic'
import { use3DSupport } from '@/lib/use-3d-support'

const AboutScene = dynamic(
  () => import('./about-scene').then((m) => m.AboutScene),
  { ssr: false }
)

/**
 * Floating-pearl backdrop for the About hero. Renders nothing on
 * unsupported devices so the static image hero behind it stays clean.
 */
export function AboutPearls() {
  const supports3D = use3DSupport()
  if (!supports3D) return null
  return (
    <div
      aria-hidden
      data-testid="about-pearls"
      className="pointer-events-none absolute inset-0 mix-blend-screen opacity-90"
    >
      <AboutScene />
    </div>
  )
}
