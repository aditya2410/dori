'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type AuthState = { error: string } | { message: string } | null

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
  next: z.string().startsWith('/').optional().catch(undefined),
})

const signupSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  next: z.string().startsWith('/').optional().catch(undefined),
})

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    // Map Supabase's generic messages to friendlier ones
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Incorrect email or password.' }
    }
    return { error: error.message }
  }

  redirect(parsed.data.next ?? '/account')
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'An account with this email already exists. Try signing in.' }
    }
    return { error: error.message }
  }

  // When email confirmation is enabled, Supabase silently re-sends a notification
  // to existing accounts instead of returning an error (prevents email enumeration).
  // An existing account is identified by an empty identities array.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { error: 'An account with this email already exists. Try signing in.' }
  }

  // Supabase returns a session immediately if email confirmation is disabled.
  // If email confirmation is enabled, data.session is null.
  if (!data.session) {
    return { message: 'Check your email — we sent you a confirmation link.' }
  }

  redirect(parsed.data.next ?? '/account')
}

const emailCodeSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  next: z.string().startsWith('/').optional().catch(undefined),
})

// Passwordless login — email the customer a one-time code (Shopify-style).
// shouldCreateUser:false so this only logs into existing accounts (guest
// checkout already created the account).
export async function sendLoginCode(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = emailCodeSchema.safeParse({
    email: formData.get('email'),
    next: formData.get('next'),
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = await createClient()
  await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { shouldCreateUser: false },
  })

  // Always return the same message — don't reveal whether the account exists.
  return { message: 'If an account exists for that email, a 6-digit code is on its way.' }
}

export async function verifyLoginCode(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string
  const token = (formData.get('token') as string)?.trim()
  const next = formData.get('next')

  if (!z.string().email().safeParse(email).success) return { error: 'Enter a valid email.' }
  if (!token || token.length < 6) return { error: 'Enter the 6-digit code from your email.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
  if (error) return { error: 'Invalid or expired code. Request a new one.' }

  redirect(typeof next === 'string' && next.startsWith('/') ? next : '/account')
}

export async function loginWithGoogle(formData: FormData): Promise<never> {
  const headersList = await headers()
  const origin = headersList.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL!

  const next = formData.get('next')
  const callbackUrl = next && typeof next === 'string' && next.startsWith('/')
    ? `${origin}/callback?next=${encodeURIComponent(next)}`
    : `${origin}/callback`

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  })

  if (error || !data.url) {
    redirect('/login?error=google_oauth_failed')
  }

  redirect(data.url)
}

export async function logout(): Promise<never> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function sendPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = formData.get('email') as string
  if (!z.string().email().safeParse(email).success) {
    return { error: 'Please enter a valid email address.' }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const supabase = await createClient()
  // Route through /callback so the code is exchanged in a Route Handler
  // (Server Components cannot set cookies, Route Handlers can).
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/callback?next=/reset-password`,
  })

  // Always return same message — don't reveal whether email exists
  return { message: 'If an account exists for that email, a reset link is on its way.' }
}

export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (password !== confirm) return { error: 'Passwords do not match.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: error.message }

  redirect('/account')
}
