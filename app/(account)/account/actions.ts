'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export type ProfileState = { error: string } | { success: string } | null

const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required.').max(100),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{7,20}$/, 'Enter a valid phone number.')
    .optional()
    .or(z.literal('')),
})

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const parsed = profileSchema.safeParse({
    full_name: formData.get('full_name'),
    phone: formData.get('phone'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  // Verify session with anon client, then write with service client.
  // Service client lets us control exactly which fields are updated,
  // preventing role escalation via direct REST API calls.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const serviceClient = createServiceClient()
  const { error } = await serviceClient
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
      // role is intentionally excluded
    })
    .eq('id', user.id)

  if (error) {
    console.error('[updateProfile] Supabase error:', error)
    return { error: 'Could not save changes. Please try again.' }
  }

  return { success: 'Profile updated.' }
}
