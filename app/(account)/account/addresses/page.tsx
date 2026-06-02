import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Separator } from '@/components/ui/separator'
import { AddressForm } from '@/components/account/address-form'
import { EditableAddressList } from '@/components/account/editable-address-list'

export const metadata = { title: 'Addresses' }

export default async function AddressesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: addresses } = await createServiceClient()
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at')

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-normal">Saved Addresses</h1>
        <p className="text-sm text-muted-foreground">
          {addresses?.length ?? 0} saved address{addresses?.length !== 1 ? 'es' : ''}
        </p>
      </div>

      {addresses && addresses.length > 0 && (
        <EditableAddressList addresses={addresses} />
      )}

      <Separator />

      <div className="space-y-4">
        <h2 className="font-serif text-xl font-normal">Add new address</h2>
        <AddressForm />
      </div>
    </div>
  )
}
