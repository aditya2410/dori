'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'

export type ProductState = { error: string } | null

const productSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(200),
  slug: z
    .string()
    .min(1, 'Slug is required.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters and hyphens only.'),
  description: z.string().max(2000).optional(),
  price: z.coerce
    .number({ invalid_type_error: 'Enter a valid price.' })
    .positive('Price must be greater than ₹0.'),
  stock: z.coerce
    .number({ invalid_type_error: 'Enter a valid stock quantity.' })
    .int()
    .min(0, 'Stock cannot be negative.'),
  images: z.string().default('[]'),
})

function parseImages(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((u) => typeof u === 'string') : []
  } catch {
    return []
  }
}

async function syncProductSeries(
  supabase: ReturnType<typeof createServiceClient>,
  productId: string,
  seriesId: string | null,
) {
  // Delete existing series assignment for this product
  await supabase.from('product_series').delete().eq('product_id', productId)
  // Insert new one if a series was selected
  if (seriesId) {
    await supabase.from('product_series').insert({ product_id: productId, series_id: seriesId })
  }
}

export async function createProduct(
  _prev: ProductState,
  formData: FormData,
): Promise<ProductState> {
  const parsed = productSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || undefined,
    price: formData.get('price'),
    stock: formData.get('stock'),
    images: formData.get('images') ?? '[]',
    bestseller_order: formData.get('bestseller_order') || '',
  })

  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const isBestseller = formData.get('is_bestseller') === 'on'
  const seriesId = (formData.get('series_id') as string) || null
  const supabase = createServiceClient()

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      price_paise: Math.round(parsed.data.price * 100),
      stock: parsed.data.stock,
      is_active: formData.get('is_active') === 'on',
      images: parseImages(parsed.data.images),
      is_bestseller: isBestseller,
        bestseller_order: isBestseller
        ? (parseInt(formData.get('bestseller_order') as string, 10) || null)
        : null,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'A product with this slug already exists.' }
    console.error('[createProduct]', error)
    return { error: `Failed to create product: ${error.message}` }
  }

  await syncProductSeries(supabase, product.id, seriesId)

  revalidatePath('/admin/products')
  revalidatePath('/products')
  revalidatePath('/')
  redirect('/admin/products')
}

export async function updateProduct(
  productId: string,
  _prev: ProductState,
  formData: FormData,
): Promise<ProductState> {
  const parsed = productSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || undefined,
    price: formData.get('price'),
    stock: formData.get('stock'),
    images: formData.get('images') ?? '[]',
    bestseller_order: formData.get('bestseller_order') || '',
  })

  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const isBestseller = formData.get('is_bestseller') === 'on'
  const seriesId = (formData.get('series_id') as string) || null
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('products')
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      price_paise: Math.round(parsed.data.price * 100),
      stock: parsed.data.stock,
      is_active: formData.get('is_active') === 'on',
      images: parseImages(parsed.data.images),
      is_bestseller: isBestseller,
        bestseller_order: isBestseller
        ? (parseInt(formData.get('bestseller_order') as string, 10) || null)
        : null,
    })
    .eq('id', productId)

  if (error) {
    if (error.code === '23505') return { error: 'A product with this slug already exists.' }
    console.error('[updateProduct]', error)
    return { error: 'Failed to update product. Please try again.' }
  }

  await syncProductSeries(supabase, productId, seriesId)

  revalidatePath('/admin/products')
  revalidatePath(`/products/${parsed.data.slug}`)
  revalidatePath('/products')
  revalidatePath('/collections', 'layout')
  revalidatePath('/')
  redirect('/admin/products')
}

export async function toggleProductActive(productId: string, newActive: boolean): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('products').update({ is_active: newActive }).eq('id', productId)
  revalidatePath('/admin/products')
  revalidatePath('/products')
}

export async function deleteProduct(productId: string): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('product_series').delete().eq('product_id', productId)
  await supabase.from('products').delete().eq('id', productId)
  revalidatePath('/admin/products')
  revalidatePath('/products')
  revalidatePath('/')
}
