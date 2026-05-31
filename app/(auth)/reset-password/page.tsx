import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ResetPasswordForm } from './form'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams

  if (!code) redirect('/forgot-password')

  // Exchange the one-time code for a session so updateUser works
  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    redirect(
      `/login?error=reset_failed&reason=${encodeURIComponent(error.message)}`,
    )
  }

  return <ResetPasswordForm />
}
