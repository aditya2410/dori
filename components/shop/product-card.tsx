import Link from 'next/link'
import Image from 'next/image'
import { formatPrice, BLUR_PLACEHOLDER } from '@/lib/utils'
import { Tilt3D } from '@/components/three/tilt-3d'

interface ProductCardProps {
  product: {
    slug: string
    name: string
    price_paise: number
    images: unknown
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const images = Array.isArray(product.images) ? (product.images as string[]) : []
  const firstImage = images[0]

  return (
    <Link href={`/products/${product.slug}`} data-track={`product-card:${product.slug}`} className="group block">
      <Tilt3D max={6} scale={1.015}>
        <div className="aspect-[3/4] bg-secondary overflow-hidden relative">
          {firstImage ? (
            <Image
              src={firstImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <span className="font-serif text-sm text-muted-foreground tracking-widest uppercase">
                DORI
              </span>
            </div>
          )}
        </div>
      </Tilt3D>
      <div className="mt-3 space-y-0.5">
        <p className="text-sm font-medium leading-tight">{product.name}</p>
        <p className="text-sm text-muted-foreground">{formatPrice(product.price_paise)}</p>
      </div>
    </Link>
  )
}
