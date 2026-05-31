import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="font-serif text-lg tracking-tight hover:opacity-70 transition-opacity">
            DORI
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        {children}
      </main>
    </div>
  )
}
