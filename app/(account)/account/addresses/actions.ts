'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type AddressState = { error: string } | { success: true } | null

const addressSchema = z.object({
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
    line1: formData.get('line1'),
    line2: formData.get('line2') || undefined,
    city: formData.get('city'),
    state: formData.get('state'),
    pincode: formData.get('pincode'),
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // If this is the user's first address, make it default
  const { count } = await supabase
    .from('addresses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { error } = await supabase.from('addresses').insert({
    user_id: user.id,
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
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('addresses').delete().eq('id', addressId).eq('user_id', user.id)
  revalidatePath('/account/addresses')
  revalidatePath('/checkout')
}

export async function setDefaultAddress(addressId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id)
  await supabase
    .from('addresses')
    .update({ is_default: true })
    .eq('id', addressId)
    .eq('user_id', user.id)

  revalidatePath('/account/addresses')
}
