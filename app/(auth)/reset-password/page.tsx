import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ResetPasswordForm } from './form'

export default async function ResetPasswordPage() {
  // Session was set by /callback (Route Handler) after exchanging the code.
  // If no session exists, the link was invalid or already used.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/forgot-password')

  return <ResetPasswordForm />
}
