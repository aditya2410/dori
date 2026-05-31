'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6">
      <p className="font-sans text-xs tracking-[0.4em] uppercase text-muted-foreground">Error</p>
      <h1 className="font-serif text-4xl font-normal">Something went wrong</h1>
      <div className="w-8 h-px bg-accent" />
      <p className="text-sm text-muted-foreground text-center max-w-xs leading-relaxed">
        An unexpected error occurred. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  )
}
