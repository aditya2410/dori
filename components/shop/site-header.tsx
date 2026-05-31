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
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-serif text-xl tracking-tight hover:opacity-70 transition-opacity"
          >
            DORI
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/products"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Shop
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-0.5">
          <CartIcon />
          {user ? (
            <Button variant="ghost" size="icon" asChild>
              <Link href="/account" aria-label="Account">
                <User className="size-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
