'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'

export type SeriesState = { error: string } | null

const VALID_POSITIONS = ['top', 'center', 'bottom', 'left', 'right'] as const

const seriesSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(200),
  slug: z
    .string()
    .min(1, 'Slug is required.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters and hyphens only.'),
  description: z.string().max(2000).optional(),
  display_order: z.coerce.number({ invalid_type_error: 'Display order must be a number.' }).int().min(0),
  cover_image_url: z.string().max(500).optional(),
  image_position: z.enum(VALID_POSITIONS).default('center'),
})

export async function createSeries(
  _prev: SeriesState,
  formData: FormData,
): Promise<SeriesState> {
  const parsed = seriesSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || undefined,
    display_order: formData.get('display_order'),
    cover_image_url: formData.get('cover_image_url') || undefined,
    image_position: formData.get('image_position') || 'center',
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { error } = await createServiceClient().from('series').insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description ?? null,
    display_order: parsed.data.display_order,
    is_active: formData.get('is_active') === 'on',
    cover_image_url: parsed.data.cover_image_url ?? null,
    image_position: parsed.data.image_position,
  })

  if (error) {
    if (error.code === '23505') return { error: 'A series with this slug already exists.' }
    console.error('[createSeries]', error)
    return { error: 'Failed to create series.' }
  }

  revalidatePaths()
  redirect('/admin/series')
}

export async function updateSeries(
  seriesId: string,
  _prev: SeriesState,
  formData: FormData,
): Promise<SeriesState> {
  const parsed = seriesSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || undefined,
    display_order: formData.get('display_order'),
    cover_image_url: formData.get('cover_image_url') || undefined,
    image_position: formData.get('image_position') || 'center',
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { error } = await createServiceClient()
    .from('series')
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      display_order: parsed.data.display_order,
      is_active: formData.get('is_active') === 'on',
      cover_image_url: parsed.data.cover_image_url ?? null,
    })
    .eq('id', seriesId)

  if (error) {
    if (error.code === '23505') return { error: 'A series with this slug already exists.' }
    console.error('[updateSeries]', error)
    return { error: 'Failed to update series.' }
  }

  revalidatePaths()
  redirect('/admin/series')
}

export async function toggleSeriesActive(seriesId: string, newActive: boolean): Promise<void> {
  await createServiceClient().from('series').update({ is_active: newActive }).eq('id', seriesId)
  revalidatePaths()
}

export async function deleteSeries(seriesId: string): Promise<{ error?: string }> {
  const supabase = createServiceClient()

  const { count } = await supabase
    .from('product_series')
    .select('product_id', { count: 'exact', head: true })
    .eq('series_id', seriesId)

  if ((count ?? 0) > 0) {
    return { error: `Cannot delete — ${count} product(s) are assigned to this series. Remove them first.` }
  }

  await supabase.from('series').delete().eq('id', seriesId)
  revalidatePaths()
  return {}
}

function revalidatePaths() {
  revalidatePath('/admin/series')
  revalidatePath('/collections')
}
