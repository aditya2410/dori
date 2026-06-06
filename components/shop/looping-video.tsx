'use client'

import { useRef, useEffect } from 'react'

interface LoopingVideoProps {
  src: string
  className?: string
}

export function LoopingVideo({ src, className }: LoopingVideoProps) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return

    function resume() {
      if (!document.hidden && video) {
        video.play().catch(() => {})
      }
    }

    document.addEventListener('visibilitychange', resume)
    return () => document.removeEventListener('visibilitychange', resume)
  }, [])

  return (
    <video
      ref={ref}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      className={className}
    />
  )
}
