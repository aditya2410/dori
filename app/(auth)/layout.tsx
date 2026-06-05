import Link from 'next/link'
import { AnimatedContent } from '@/components/ui/animated-content'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/60">
        <div className="container flex h-14 items-center">
          <Link href="/" aria-label="Dori Jaipur" className="font-serif text-lg tracking-tight hover:opacity-70 transition-opacity">
            DORI
          </Link>
        </div>
      </header>
      <AnimatedContent className="flex-1 flex items-center justify-center py-16 px-4">
        {children}
      </AnimatedContent>
    </div>
  )
}
