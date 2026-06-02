'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export type AddressState = { error: string } | { success: true } | null

const addressSchema = z.object({
  full_name: z.string().min(1, 'Full name is required.').max(100),
  phone: z.string().min(7, 'Enter a valid phone number.').max(20),
  contact_email: z.string().email('Enter a valid email.').optional().or(z.literal('')),
  line1: z.string().min(1, 'Address line 1 is required.').max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1, 'City is required.').max(100),
  state: z.string().min(1, 'State is required.').max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode.'),
})

export async function addAddress(
  _prev: AddressState,
  formData: FormData,
): Promise<AddressState> {
  const parsed = addressSchema.safeParse({
    full_name: formData.get('full_name'),
    phone: formData.get('phone'),
    contact_email: formData.get('contact_email') || undefined,
    line1: formData.get('line1'),
    line2: formData.get('line2') || undefined,
    city: formData.get('city'),
    state: formData.get('state'),
    pincode: formData.get('pincode'),
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  // If this is the user's first address, make it default
  const { count } = await service
    .from('addresses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { error } = await service.from('addresses').insert({
    user_id: user.id,
    full_name: parsed.data.full_name,
    phone: parsed.data.phone,
    contact_email: parsed.data.contact_email || null,
    line1: parsed.data.line1,
    line2: parsed.data.line2 ?? null,
    city: parsed.data.city,
    state: parsed.data.state,
    pincode: parsed.data.pincode,
    is_default: (count ?? 0) === 0,
  })

  if (error) {
    console.error('[addAddress]', error)
    return { error: 'Failed to save address.' }
  }

  revalidatePath('/account/addresses')
  revalidatePath('/checkout')
  return { success: true }
}

export async function deleteAddress(addressId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  await service.from('addresses').delete().eq('id', addressId).eq('user_id', user.id)
  revalidatePath('/account/addresses')
  revalidatePath('/checkout')
}

export async function setDefaultAddress(addressId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  await service.from('addresses').update({ is_default: false }).eq('user_id', user.id)
  await service.from('addresses').update({ is_default: true }).eq('id', addressId).eq('user_id', user.id)

  revalidatePath('/account/addresses')
}
