import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logout } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await createServiceClient()
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  // Server-side role check — the middleware only verifies a session exists
  if (profile?.role !== 'admin') redirect('/')

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/60">
        <div className="container flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="font-serif text-lg tracking-tight hover:opacity-70 transition-opacity"
            >
              DORI
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Admin</span>
          </div>

          <nav className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/products">Products</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/series">Series</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/orders">Orders</Link>
            </Button>
          </nav>

          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              Log out
            </Button>
          </form>
        </div>
      </header>

      <main className="flex-1 container py-10">{children}</main>
    </div>
  )
}
