import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logout } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Middleware handles the redirect, but this is a server-side safety net
  if (!user) redirect('/login')

  const { data: profile } = await createServiceClient()
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/60">
        <div className="container flex h-14 items-center justify-between">
          <Link
            href="/"
            className="font-serif text-lg tracking-tight hover:opacity-70 transition-opacity"
          >
            DORI
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/account">Profile</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/account/addresses">Addresses</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/account/orders">Orders</Link>
            </Button>
            {profile?.role === 'admin' && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin">Admin</Link>
              </Button>
            )}
          </nav>

          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              Log out
            </Button>
          </form>
        </div>
      </header>

      <Separator />

      <main className="flex-1 container py-12 max-w-2xl">{children}</main>
    </div>
  )
}
