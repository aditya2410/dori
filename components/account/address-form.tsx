'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { addAddress, type AddressState } from '@/app/(account)/account/addresses/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AddressFormProps {
  onSuccess?: () => void
  submitLabel?: string
}

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : label}
    </Button>
  )
}

export function AddressForm({ onSuccess, submitLabel = 'Save address' }: AddressFormProps) {
  const [state, formAction] = useActionState<AddressState, FormData>(addAddress, null)

  useEffect(() => {
    if (state && 'success' in state) onSuccess?.()
  }, [state, onSuccess])

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="line1">Address line 1</Label>
        <Input id="line1" name="line1" placeholder="Building, street" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="line2">
          Line 2{' '}
          <span className="text-muted-foreground font-normal normal-case tracking-normal">
            (optional)
          </span>
        </Label>
        <Input id="line2" name="line2" placeholder="Apartment, floor, landmark" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" placeholder="Mumbai" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" placeholder="Maharashtra" required />
        </div>
      </div>

      <div className="space-y-1.5 max-w-[160px]">
        <Label htmlFor="pincode">Pincode</Label>
        <Input id="pincode" name="pincode" placeholder="400001" maxLength={6} required />
      </div>

      {state && 'error' in state && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <SaveButton label={submitLabel} />
    </form>
  )
}
