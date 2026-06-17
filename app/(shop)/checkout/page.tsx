import type { Metadata } from 'next'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { CheckoutFlow } from '@/components/checkout/checkout-flow'

export const metadata: Metadata = { title: 'Checkout' }

export default async function CheckoutPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Guests can check out without an account — no login redirect.
  if (!user) {
    return (
      <CheckoutFlow isGuest addresses={[]} userEmail="" userName="" userPhone="" />
    )
  }

  const service = createServiceClient()
  const [{ data: addresses }, { data: profile }] = await Promise.all([
    service
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at'),
    service.from('profiles').select('full_name, phone').eq('id', user.id).single(),
  ])

  return (
    <CheckoutFlow
      isGuest={false}
      addresses={addresses ?? []}
      userEmail={user.email ?? ''}
      userName={profile?.full_name ?? ''}
      userPhone={profile?.phone ?? ''}
    />
  )
}
