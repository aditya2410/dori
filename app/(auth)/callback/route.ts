import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') ?? ''
  const next = searchParams.get('next') ?? '/account'
  const redirectTo = next.startsWith('/') ? next : '/account'
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin

  const supabase = await createClient()

  // token_hash flow — works across any browser (no code_verifier needed)
  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'recovery' | 'signup' | 'email',
    })
    if (!error) return NextResponse.redirect(`${base}${redirectTo}`)
    console.error('[callback] verifyOtp error:', error.message)
    return NextResponse.redirect(
      `${base}/login?error=callback_failed&reason=${encodeURIComponent(error.message)}`,
    )
  }

  // PKCE code flow — requires same browser session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${base}${redirectTo}`)
    console.error('[callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(
      `${base}/login?error=callback_failed&reason=${encodeURIComponent(error.message)}`,
    )
  }

  return NextResponse.redirect(`${base}/login?error=callback_failed&reason=no_code`)
}
