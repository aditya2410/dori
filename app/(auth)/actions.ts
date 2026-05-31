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

  redirect('/account')
}

export async function loginWithGoogle(): Promise<never> {
  const headersList = await headers()
  const origin = headersList.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL!

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/callback`,
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
