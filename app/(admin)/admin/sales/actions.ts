'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'

export type SaleState = { error: string } | null

const saleSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required.')
    .max(40)
    .regex(/^[A-Za-z0-9]+$/, 'Code must be letters and numbers only (no spaces).'),
  description: z.string().max(200).optional(),
  banner_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Pick a valid color.').optional(),
  discount_percent: z.coerce
    .number({ invalid_type_error: 'Enter a discount percentage.' })
    .int()
    .min(1, 'Discount must be between 1 and 100%.')
    .max(100, 'Discount must be between 1 and 100%.'),
  min_order: z.coerce.number().min(0).optional(),
  max_discount: z.coerce.number().min(0).optional(),
  usage_limit: z.coerce.number().int().positive().optional(),
  starts_at: z.string().min(1, 'Start date is required.'),
  ends_at: z.string().min(1, 'End date is required.'),
})

function toPaise(rupees: number | undefined): number | null {
  return rupees != null ? Math.round(rupees * 100) : null
}

type SaleFields = {
  code: string
  description: string | null
  banner_color: string | null
  discount_percent: number
  min_order_paise: number | null
  max_discount_paise: number | null
  usage_limit: number | null
  starts_at: string
  ends_at: string
  is_active: boolean
}

function parseSale(formData: FormData): { ok: true; fields: SaleFields } | { ok: false; error: string } {
  const parsed = saleSchema.safeParse({
    code: formData.get('code'),
    description: formData.get('description') || undefined,
    banner_color: formData.get('banner_color') || undefined,
    discount_percent: formData.get('discount_percent'),
    min_order: formData.get('min_order') || undefined,
    max_discount: formData.get('max_discount') || undefined,
    usage_limit: formData.get('usage_limit') || undefined,
    starts_at: formData.get('starts_at'),
    ends_at: formData.get('ends_at'),
  })
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0].message }

  const startsAt = new Date(parsed.data.starts_at)
  const endsAt = new Date(parsed.data.ends_at)
  if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) return { ok: false, error: 'Invalid dates.' }
  if (endsAt <= startsAt) return { ok: false, error: 'End date must be after the start date.' }

  return {
    ok: true,
    fields: {
      code: parsed.data.code,
      description: parsed.data.description ?? null,
      banner_color: parsed.data.banner_color ?? null,
      discount_percent: parsed.data.discount_percent,
      min_order_paise: toPaise(parsed.data.min_order),
      max_discount_paise: toPaise(parsed.data.max_discount),
      usage_limit: parsed.data.usage_limit ?? null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      is_active: formData.get('is_active') === 'on',
    },
  }
}

export async function createSale(_prev: SaleState, formData: FormData): Promise<SaleState> {
  const result = parseSale(formData)
  if (!result.ok) return { error: result.error }

  const { error } = await createServiceClient().from('sales').insert(result.fields)
  if (error) {
    if (error.code === '23505') return { error: 'A code with this name already exists.' }
    console.error('[createSale]', error)
    return { error: `Failed to create sale: ${error.message}` }
  }

  revalidatePath('/admin/sales')
  revalidatePath('/')
  redirect('/admin/sales')
}

export async function updateSale(saleId: string, _prev: SaleState, formData: FormData): Promise<SaleState> {
  const result = parseSale(formData)
  if (!result.ok) return { error: result.error }

  const { error } = await createServiceClient().from('sales').update(result.fields).eq('id', saleId)
  if (error) {
    if (error.code === '23505') return { error: 'A code with this name already exists.' }
    console.error('[updateSale]', error)
    return { error: 'Failed to update sale. Please try again.' }
  }

  revalidatePath('/admin/sales')
  revalidatePath('/')
  redirect('/admin/sales')
}

export async function toggleSaleActive(saleId: string, newActive: boolean): Promise<void> {
  await createServiceClient().from('sales').update({ is_active: newActive }).eq('id', saleId)
  revalidatePath('/admin/sales')
  revalidatePath('/')
}

export async function deleteSale(saleId: string): Promise<void> {
  await createServiceClient().from('sales').delete().eq('id', saleId)
  revalidatePath('/admin/sales')
  revalidatePath('/')
}
