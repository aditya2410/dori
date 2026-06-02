'use client'

import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from '@/components/ui/sheet'
import { logout } from '@/app/(auth)/actions'

interface AccountNavProps {
  isAdmin: boolean
  email: string
}

export function AccountNav({ isAdmin, email }: AccountNavProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button aria-label="Open account menu" className="p-1 text-foreground">
          <Menu className="size-5" />
        </button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[80vw] max-w-sm flex flex-col p-0 overflow-hidden">
        <SheetTitle className="sr-only">Account menu</SheetTitle>

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <SheetClose asChild>
            <Link
              href="/"
              className="font-serif text-sm tracking-[0.25em] uppercase hover:opacity-70 transition-opacity"
            >
              Dori Jaipur
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <button aria-label="Close menu" className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              <X className="size-5" />
            </button>
          </SheetClose>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-6 py-4">
          <SheetClose asChild>
            <Link href="/account/orders" className="flex items-center py-3.5 text-sm tracking-wide border-b border-border/40 hover:text-muted-foreground transition-colors">
              My Orders
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link href="/account/addresses" className="flex items-center py-3.5 text-sm tracking-wide border-b border-border/40 hover:text-muted-foreground transition-colors">
              Saved Addresses
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link href="/account/profile" className="flex items-center py-3.5 text-sm tracking-wide border-b border-border/40 hover:text-muted-foreground transition-colors">
              Profile
            </Link>
          </SheetClose>
          {isAdmin && (
            <SheetClose asChild>
              <Link href="/admin" className="flex items-center py-3.5 text-sm tracking-wide border-b border-border/40 hover:text-muted-foreground transition-colors">
                Admin Panel
              </Link>
            </SheetClose>
          )}
        </nav>

        {/* Sign out */}
        <div className="px-6 py-4 border-t border-border space-y-3 shrink-0">
          <p className="text-xs text-muted-foreground truncate">{email}</p>
          <form action={logout}>
            <button type="submit" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign Out
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
