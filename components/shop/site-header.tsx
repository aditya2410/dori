import Link from 'next/link'
import { User, ChevronDown } from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { CartIcon } from './cart-icon'
import { MobileNav } from './mobile-nav'
import { SocialLinks } from './social-links'

export async function SiteHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: series } = await createServiceClient()
    .from('series')
    .select('id, slug, name')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const activeSeries = series ?? []

  return (
    <header className="border-b border-border/60 bg-background sticky top-0 z-40">

      {/* ── Mobile layout: hamburger | logo | icons ── */}
      <div className="md:hidden container grid grid-cols-3 h-14 items-center">
        <div className="flex justify-start">
          <MobileNav series={activeSeries} user={user} />
        </div>

        <div className="flex justify-center">
          <Link
            href="/"
            className="font-serif text-base tracking-[0.15em] uppercase hover:opacity-70 transition-opacity"
          >
            Dori
          </Link>
        </div>

        <div className="flex justify-end items-center gap-0.5 -mr-2">
          <CartIcon />
          {user ? (
            <Button variant="ghost" size="icon" asChild>
              <Link href="/account" aria-label="Account">
                <User className="size-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login" className="text-xs tracking-wide">Sign in</Link>
            </Button>
          )}
        </div>
      </div>

      {/* ── Desktop layout: nav | centered logo | icons ── */}
      <div className="hidden md:flex container h-16 items-center">

        {/* Left nav */}
        <nav className="flex items-center gap-7 flex-1">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide"
          >
            Home
          </Link>

          {/* Collections hover dropdown */}
          <div className="group relative">
            <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide">
              Collections
              <ChevronDown className="size-3.5 transition-transform duration-200 group-hover:rotate-180" />
            </button>
            <div className="absolute top-full left-0 pt-3 hidden group-hover:block z-50">
              <div className="bg-background border border-border min-w-[160px] py-1 shadow-sm">
                <Link
                  href="/products"
                  className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors tracking-wide"
                >
                  All Bags
                </Link>
                {activeSeries.map((s) => (
                  <Link
                    key={s.id}
                    href={`/collections/${s.slug}`}
                    className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors tracking-wide"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link
            href="/about"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide"
          >
            About
          </Link>

          <Link
            href="/contact"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide"
          >
            Contact
          </Link>
        </nav>

        {/* Centered wordmark */}
        <Link
          href="/"
          className="font-serif text-xl tracking-[0.1em] uppercase hover:opacity-70 transition-opacity shrink-0 px-8"
        >
          Dori Jaipur
        </Link>

        {/* Right: social + cart + account */}
        <div className="flex items-center gap-2 justify-end flex-1">
          <SocialLinks iconClassName="size-3.5" />
          {/* subtle divider only when social links are present */}
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
