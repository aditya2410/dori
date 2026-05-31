import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CheckoutFlow } from '@/components/checkout/checkout-flow'

export const metadata: Metadata = { title: 'Checkout' }

export default async function CheckoutPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/checkout')

  const [{ data: addresses }, { data: profile }] = await Promise.all([
    supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at'),
    supabase.from('profiles').select('full_name, phone').eq('id', user.id).single(),
  ])

  return (
    <>
      <CheckoutFlow
        addresses={addresses ?? []}
        userEmail={user.email ?? ''}
        userName={profile?.full_name ?? ''}
        userPhone={profile?.phone ?? ''}
      />
    </>
  )
}
