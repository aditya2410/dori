'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updatePassword } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? 'Saving…' : 'Set new password'}
    </Button>
  )
}

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(updatePassword, null)

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-1 text-center">
        <h1 className="font-serif text-3xl font-normal">New Password</h1>
        <p className="text-sm text-muted-foreground">Choose a strong password</p>
      </div>

      <form action={formAction} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            minLength={8}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={8}
            required
          />
        </div>

        {state && 'error' in state && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <SubmitButton />
      </form>
    </div>
  )
}
