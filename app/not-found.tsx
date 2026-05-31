import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6">
      <p className="font-sans text-xs tracking-[0.4em] uppercase text-muted-foreground">404</p>
      <h1 className="font-serif text-4xl font-normal">Page not found</h1>
      <div className="w-8 h-px bg-accent" />
      <p className="text-sm text-muted-foreground text-center max-w-xs leading-relaxed">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  )
}
