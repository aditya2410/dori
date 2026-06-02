import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logout } from '@/app/(auth)/actions'
import { CartIcon } from '@/components/shop/cart-icon'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Account' }

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const [{ data: profile }, { data: series }] = await Promise.all([
    service.from('profiles').select('full_name, role').eq('id', user.id).single(),
    service.from('series').select('id, slug, name').eq('is_active', true).order('display_order'),
  ])

  return (
    <div className="min-h-screen flex flex-col max-w-sm mx-auto px-6">

      {/* Cart icon top-right */}
      <div className="flex justify-end pt-4">
        <CartIcon />
      </div>

      {/* DORI centered */}
      <div className="flex justify-center py-8">
        <Link
          href="/"
          className="font-serif text-xl tracking-[0.2em] uppercase hover:opacity-70 transition-opacity"
        >
          Dori Jaipur
        </Link>
      </div>

      <div className="h-px bg-border" />

      {/* Shop navigation */}
      <nav className="py-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Shop</p>

        <NavLink href="/products">All Bags</NavLink>

        {(series ?? []).map((s) => (
          <NavLink key={s.id} href={`/collections/${s.slug}`} indent>
            {s.name}
          </NavLink>
        ))}

        <NavLink href="/about">About</NavLink>
        <NavLink href="/contact">Contact</NavLink>
      </nav>

      <div className="h-px bg-border" />

      {/* Account navigation */}
      <nav className="py-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">My Account</p>

        <NavLink href="/account/orders">My Orders</NavLink>
        <NavLink href="/account/addresses">Saved Addresses</NavLink>
        <NavLink href="/account/profile">Profile</NavLink>
        {profile?.role === 'admin' && (
          <NavLink href="/admin">Admin Panel</NavLink>
        )}
      </nav>

      <div className="h-px bg-border" />

      {/* Sign out */}
      <div className="py-5 space-y-3">
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm tracking-wide text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign Out
          </button>
        </form>
      </div>

    </div>
  )
}

function NavLink({
  href,
  children,
  indent,
}: {
  href: string
  children: React.ReactNode
  indent?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center py-3 text-sm tracking-wide border-b border-border/40 hover:text-muted-foreground transition-colors',
        indent && 'pl-4 text-xs text-muted-foreground',
      )}
    >
      {children}
    </Link>
  )
}
