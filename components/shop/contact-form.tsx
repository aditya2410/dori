'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { submitContact, type ContactFormState } from '@/app/(shop)/contact/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Sending…' : 'Send message'}
    </Button>
  )
}

export function ContactForm() {
  const [state, formAction] = useActionState<ContactFormState, FormData>(
    submitContact,
    {},
  )

  if (state.ok) {
    return (
      <div className="border border-border/60 p-8 text-center space-y-2">
        <p className="font-serif text-xl font-light">Thank you.</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We received your message and will reply within 24 hours.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" type="text" autoComplete="name" placeholder="Your name" required />
          {state.errors?.name && (
            <p className="text-xs text-destructive">{state.errors.name}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" required />
          {state.errors?.phone && (
            <p className="text-xs text-destructive">{state.errors.phone}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        {state.errors?.email && (
          <p className="text-xs text-destructive">{state.errors.email}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Tell us what you're looking for…"
          rows={5}
          required
        />
        {state.errors?.message && (
          <p className="text-xs text-destructive">{state.errors.message}</p>
        )}
      </div>

      {state.errors?._form && (
        <p className="text-sm text-destructive">{state.errors._form}</p>
      )}

      <SubmitButton />
    </form>
  )
}
