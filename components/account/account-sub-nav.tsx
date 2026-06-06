import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { CartIcon } from '@/components/shop/cart-icon'

export function AccountSubNav() {
  return (
    <header className="border-b border-border/60 sticky top-0 bg-background z-40">
      <div className="container flex h-14 items-center justify-between">
        <Link
          href="/account"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Account
        </Link>

        <Link
          href="/"
          aria-label="Dori Jaipur"
          className="font-serif text-base tracking-[0.15em] uppercase hover:opacity-70 transition-opacity"
        >
          Dori Jaipur
        </Link>

        <CartIcon />
      </div>
    </header>
  )
}
