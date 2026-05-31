import { redirect } from 'next/navigation'
import { MapPin, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Separator } from '@/components/ui/separator'
import { AddressForm } from '@/components/account/address-form'
import { deleteAddress, setDefaultAddress } from './actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Addresses' }

export default async function AddressesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: addresses } = await supabase
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
        <div className="space-y-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="border p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="text-sm leading-relaxed">
                    <p className="font-medium">
                      {addr.line1}
                      {addr.is_default && (
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          Default
                        </Badge>
                      )}
                    </p>
                    {addr.line2 && <p className="text-muted-foreground">{addr.line2}</p>}
                    <p className="text-muted-foreground">
                      {addr.city}, {addr.state} {addr.pincode}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pl-7">
                {!addr.is_default && (
                  <form action={setDefaultAddress.bind(null, addr.id)}>
                    <Button type="submit" variant="ghost" size="sm" className="h-7 text-xs">
                      <Star className="size-3" />
                      Set default
                    </Button>
                  </form>
                )}
                <form action={deleteAddress.bind(null, addr.id)}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <Separator />

      <div className="space-y-4">
        <h2 className="font-serif text-xl font-normal">Add new address</h2>
        <AddressForm />
      </div>
    </div>
  )
}
