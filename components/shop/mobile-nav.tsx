'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ChevronDown } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from '@/components/ui/sheet'
import { SocialLinks } from '@/components/shop/social-links'
import { logout } from '@/app/(auth)/actions'
import { siteConfig } from '@/lib/config'
import { cn } from '@/lib/utils'

interface Series {
  id: string
  slug: string
  name: string
}

interface MobileNavProps {
  series: Series[]
  user: { id: string; email?: string } | null
}

export function MobileNav({ series, user }: MobileNavProps) {
  const [collectionsOpen, setCollectionsOpen] = useState(false)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button aria-label="Open menu" className="p-1 text-foreground">
          <Menu className="size-5" />
        </button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[80vw] max-w-sm flex flex-col p-0 overflow-hidden">
        {/* Accessible title (visually hidden) */}
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>

        {/* Top bar: wordmark + close */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <SheetClose asChild>
            <Link
              href="/"
              className="font-serif text-sm tracking-[0.25em] uppercase hover:opacity-70 transition-opacity"
            >
              {siteConfig.brandName}
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <button
              aria-label="Close menu"
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-5" />
            </button>
          </SheetClose>
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto px-6 py-4">
          <SheetClose asChild>
            <Link
              href="/"
              className="flex items-center py-3.5 text-sm tracking-wide border-b border-border/40 hover:text-muted-foreground transition-colors"
            >
              Home
            </Link>
          </SheetClose>

          {/* Collections accordion */}
          <div className="border-b border-border/40">
            <button
              onClick={() => setCollectionsOpen((v) => !v)}
              className="flex items-center justify-between w-full py-3.5 text-sm tracking-wide hover:text-muted-foreground transition-colors"
            >
              Collections
              <ChevronDown
                className={cn(
                  'size-4 text-muted-foreground transition-transform duration-200',
                  collectionsOpen && 'rotate-180',
                )}
              />
            </button>
            {collectionsOpen && series.length > 0 && (
              <div className="pb-3 pl-4 space-y-0.5">
                {series.map((s) => (
                  <SheetClose key={s.id} asChild>
                    <Link
                      href={`/collections/${s.slug}`}
                      className="block py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {s.name}
                    </Link>
                  </SheetClose>
                ))}
              </div>
            )}
          </div>

          <SheetClose asChild>
            <Link
              href="/about"
              className="flex items-center py-3.5 text-sm tracking-wide border-b border-border/40 hover:text-muted-foreground transition-colors"
            >
              About Us
            </Link>
          </SheetClose>

          <SheetClose asChild>
            <Link
              href="/contact"
              className="flex items-center py-3.5 text-sm tracking-wide border-b border-border/40 hover:text-muted-foreground transition-colors"
            >
              Contact Us
            </Link>
          </SheetClose>
        </nav>

        {/* Account section */}
        <div className="px-6 py-4 border-t border-border space-y-3 shrink-0">
          {user ? (
            <>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              <SheetClose asChild>
                <Link
                  href="/account"
                  className="block text-sm tracking-wide hover:text-muted-foreground transition-colors"
                >
                  My Account
                </Link>
              </SheetClose>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <SheetClose asChild>
              <Link
                href="/login"
                className="block text-sm tracking-wide hover:text-muted-foreground transition-colors"
              >
                Sign In
              </Link>
            </SheetClose>
          )}
        </div>

        {/* Social + copyright */}
        <div className="px-6 py-4 border-t border-border space-y-3 shrink-0">
          <SocialLinks />
          <p className="text-xs text-muted-foreground tracking-wide">
            © {new Date().getFullYear()} {siteConfig.brandName}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
