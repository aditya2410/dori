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

    function play() {
      video?.play().catch(() => {})
    }

    // Any pause on a controls-free looping video is unintentional (background, call, etc.)
    // Wait 300ms so we don't fight a legitimate browser pause, then resume if still paused
    function handlePause() {
      setTimeout(() => {
        if (video && video.paused) play()
      }, 300)
    }

    function handleVisibility() {
      if (!document.hidden) play()
    }

    video.addEventListener('pause', handlePause)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('pageshow', play)
    window.addEventListener('focus', play)

    return () => {
      video.removeEventListener('pause', handlePause)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pageshow', play)
      window.removeEventListener('focus', play)
    }
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
