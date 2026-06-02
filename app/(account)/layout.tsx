import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { CartIcon } from '@/components/shop/cart-icon'
import { AccountNav } from '@/components/account/account-nav'

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
        <div className="container grid grid-cols-3 h-14 items-center">
          <div className="flex justify-start">
            <AccountNav isAdmin={isAdmin} email={user.email ?? ''} />
          </div>

          <div className="flex justify-center">
            <Link
              href="/"
              className="font-serif text-base tracking-[0.15em] uppercase hover:opacity-70 transition-opacity"
            >
              Dori
            </Link>
          </div>

          <div className="flex justify-end">
            <CartIcon />
          </div>
        </div>
      </header>

      <main className="flex-1 container py-12 max-w-2xl">
        {children}
      </main>
    </div>
  )
}
