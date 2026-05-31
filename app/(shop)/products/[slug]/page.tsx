import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { AddToCart } from '@/components/shop/add-to-cart'
import { ImageGallery } from '@/components/shop/image-gallery'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { data } = await createServiceClient()
    .from('products')
    .select('name, description')
    .eq('slug', slug)
    .single()
  if (!data) return {}
  return { title: data.name, description: data.description ?? undefined }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const { data: product } = await createServiceClient()
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!product) notFound()

  const images = Array.isArray(product.images) ? (product.images as string[]) : []

  return (
    <div className="container py-8 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-20">
        {/* Image gallery */}
        <ImageGallery images={images} productName={product.name} />

        {/* Product info */}
        <div className="flex flex-col gap-6 md:pt-4">
          <div className="space-y-2">
            <h1 className="font-serif text-3xl md:text-4xl font-normal leading-tight">
              {product.name}
            </h1>
            <p className="text-xl">{formatPrice(product.price_paise)}</p>
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          <div className="pt-2 space-y-2">
            <AddToCart
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                pricePaise: product.price_paise,
                image: images[0] ?? null,
                stock: product.stock,
              }}
            />
            {product.stock > 0 && product.stock <= 5 && (
              <p className="text-xs text-center text-muted-foreground">
                Only {product.stock} left
              </p>
            )}
          </div>

          <div className="border-t pt-6 mt-auto">
            <p className="text-xs text-muted-foreground leading-relaxed">
              ₹150 flat shipping &nbsp;·&nbsp; Handcrafted and shipped within 3–5 days
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
