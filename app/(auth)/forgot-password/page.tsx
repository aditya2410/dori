'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { sendPasswordReset } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? 'Sending…' : 'Send reset link'}
    </Button>
  )
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(sendPasswordReset, null)

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-1 text-center">
        <h1 className="font-serif text-3xl font-normal">Reset Password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we'll send you a link
        </p>
      </div>

      {state && 'message' in state ? (
        <p className="text-sm text-center text-muted-foreground border border-border/60 p-4 leading-relaxed">
          {state.message}
        </p>
      ) : (
        <form action={formAction} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </div>

          {state && 'error' in state && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <SubmitButton />
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Remember it?{' '}
        <Link href="/login" className="text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity">
          Sign in
        </Link>
      </p>
    </div>
  )
}
