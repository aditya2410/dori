'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateProfile, type ProfileState } from '@/app/(account)/account/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProfileFormProps {
  fullName: string | null
  phone: string | null
}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save changes'}
    </Button>
  )
}

export function ProfileForm({ fullName, phone }: ProfileFormProps) {
  const [state, formAction] = useActionState<ProfileState, FormData>(updateProfile, null)

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          name="full_name"
          type="text"
          defaultValue={fullName ?? ''}
          autoComplete="name"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={phone ?? ''}
          autoComplete="tel"
          placeholder="+91 98765 43210"
        />
      </div>

      {state && 'error' in state && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      {state && 'success' in state && (
        <p className="text-sm text-muted-foreground">{state.success}</p>
      )}

      <SaveButton />
    </form>
  )
}
