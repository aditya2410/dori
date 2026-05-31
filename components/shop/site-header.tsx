import Link from 'next/link'
import { User } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { CartIcon } from './cart-icon'

export async function SiteHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="border-b border-border/60 bg-background">
      <div className="container flex h-14 md:h-16 items-center justify-between gap-4">

        {/* Left: logo + nav */}
        <div className="flex items-center gap-5 md:gap-8">
          <Link
            href="/"
            className="font-serif text-lg md:text-xl tracking-tight hover:opacity-70 transition-opacity shrink-0"
          >
            DORI
          </Link>
          <nav className="flex items-center gap-4 md:gap-6">
            <Link
              href="/products"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Shop
            </Link>
          </nav>
        </div>

        {/* Right: cart + account */}
        <div className="flex items-center gap-0.5 shrink-0">
          <CartIcon />
          {user ? (
            <Button variant="ghost" size="icon" asChild>
              <Link href="/account" aria-label="Account">
                <User className="size-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login" className="text-sm">Sign in</Link>
            </Button>
          )}
        </div>

      </div>
    </header>
  )
}
