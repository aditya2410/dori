import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { CartIcon } from '@/components/shop/cart-icon'
import { AccountNav } from '@/components/account/account-nav'
import { logout } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await createServiceClient()
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/60 sticky top-0 bg-background z-40">

        {/* ── Mobile: hamburger | Dori | cart ── */}
        <div className="md:hidden container grid grid-cols-3 h-14 items-center">
          <div className="flex justify-start">
            <AccountNav isAdmin={isAdmin} email={user.email ?? ''} />
          </div>
          <div className="flex justify-center">
            <Link href="/" aria-label="Dori Jaipur" className="font-serif text-base tracking-[0.15em] uppercase hover:opacity-70 transition-opacity">
              Dori
            </Link>
          </div>
          <div className="flex justify-end">
            <CartIcon />
          </div>
        </div>

        {/* ── Desktop: Dori | nav links | cart + sign out ── */}
        <div className="hidden md:flex container h-14 items-center justify-between gap-6">
          <Link href="/" aria-label="Dori Jaipur" className="font-serif text-lg tracking-[0.15em] uppercase hover:opacity-70 transition-opacity shrink-0">
            Dori
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/account/orders">My Orders</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/account/addresses">Addresses</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/account/profile">Profile</Link>
            </Button>
            {isAdmin && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin">Admin</Link>
              </Button>
            )}
          </nav>

          <div className="flex items-center gap-1 shrink-0">
            <CartIcon />
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm">Sign out</Button>
            </form>
          </div>
        </div>

      </header>

      <main className="flex-1 container py-12 max-w-2xl">
        {children}
      </main>
    </div>
  )
}
