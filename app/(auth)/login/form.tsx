'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useFormStatus } from 'react-dom'
import { login, loginWithGoogle } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </Button>
  )
}

export default function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? ''
  const urlError = searchParams.get('error')

  const [state, formAction] = useActionState(login, null)

  const reason = searchParams.get('reason')
  const errorMessage =
    (state && 'error' in state ? state.error : null) ??
    (urlError === 'google_oauth_failed' ? 'Google sign-in failed. Please try again.' : null) ??
    (urlError === 'callback_failed' ? `Sign-in link failed${reason ? `: ${reason}` : ''}. Try signing in manually.` : null)

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-1 text-center">
        <h1 className="font-serif text-3xl font-normal">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your DORI account</p>
      </div>

      <form action={loginWithGoogle}>
        <Button type="submit" variant="outline" size="lg" className="w-full gap-3">
          <GoogleIcon />
          Continue with Google
        </Button>
      </form>

      <div className="flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-xs uppercase tracking-widest text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="next" value={next} />

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
        </div>

        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

        <SubmitButton />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        No account?{' '}
        <Link href="/signup" className="text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity">
          Create one
        </Link>
      </p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}
