import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/account'
  const redirectTo = next.startsWith('/') ? next : '/account'

  // Use the configured site URL so redirects are correct behind Vercel's proxy
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${base}${redirectTo}`)
    }
    console.error('[callback] exchangeCodeForSession error:', error.message, error.code)
    return NextResponse.redirect(
      `${base}/login?error=callback_failed&reason=${encodeURIComponent(error.message)}`,
    )
  }

  return NextResponse.redirect(`${base}/login?error=callback_failed&reason=no_code`)
}
