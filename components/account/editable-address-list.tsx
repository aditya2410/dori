'use client'

import { useState } from 'react'
import { MapPin, Star, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AddressForm } from './address-form'
import { deleteAddress, setDefaultAddress, updateAddress } from '@/app/(account)/account/addresses/actions'

interface Address {
  id: string
  full_name: string | null
  phone: string | null
  contact_email: string | null
  line1: string
  line2: string | null
  city: string
  state: string
  pincode: string
  is_default: boolean
}

export function EditableAddressList({ addresses }: { addresses: Address[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {addresses.map((addr) => (
        <div key={addr.id} className="border p-5 space-y-3">
          {editingId === addr.id ? (
            <AddressForm
              address={addr}
              formAction={updateAddress.bind(null, addr.id)}
              submitLabel="Save changes"
              onSuccess={() => setEditingId(null)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="text-sm leading-relaxed">
                    <p className="font-medium">
                      {addr.full_name ?? addr.line1}
                      {addr.is_default && (
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          Default
                        </Badge>
                      )}
                    </p>
                    <p className="text-muted-foreground">{addr.line1}</p>
                    {addr.line2 && <p className="text-muted-foreground">{addr.line2}</p>}
                    <p className="text-muted-foreground">
                      {addr.city}, {addr.state} {addr.pincode}
                    </p>
                    {addr.phone && (
                      <p className="text-muted-foreground">{addr.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pl-7">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setEditingId(addr.id)}
                >
                  <Pencil className="size-3" />
                  Edit
                </Button>

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
            </>
          )}
        </div>
      ))}
    </div>
  )
}
