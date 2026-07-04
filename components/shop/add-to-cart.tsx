'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Check, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/cart'
import { trackMeta } from '@/components/analytics/meta-pixel'

interface AddToCartProps {
  product: {
    id: string
    slug: string
    name: string
    pricePaise: number
    image: string | null
    stock: number
  }
}

export function AddToCart({ product }: AddToCartProps) {
  const router = useRouter()
  const { addItem, items } = useCart()
  const [justAdded, setJustAdded] = useState(false)

  const cartItem = items.find((i) => i.productId === product.id)
  const qty = cartItem?.quantity ?? 0

  function addToCart() {
    // Each click adds another unit to the bag.
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      pricePaise: product.pricePaise,
      image: product.image,
    })
    trackMeta('AddToCart', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: product.pricePaise / 100,
      currency: 'INR',
    })
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1200)
  }

  function handleBuyNow() {
    if (qty === 0) {
      addItem({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        pricePaise: product.pricePaise,
        image: product.image,
      })
    }
    router.push('/checkout')
  }

  if (product.stock === 0) {
    return (
      <Button size="lg" className="w-full" variant="outline" disabled>
        Out of Stock
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        className="w-full"
        variant="outline"
        data-track={`add-to-cart:${product.slug}`}
        onClick={addToCart}
      >
        {justAdded ? (
          <><Check className="size-4" /> Added</>
        ) : (
          <><ShoppingBag className="size-4" /> Add to Cart</>
        )}
      </Button>
      <Button
        size="lg"
        className="w-full"
        data-track={`buy-now:${product.slug}`}
        onClick={handleBuyNow}
      >
        <Zap className="size-4" /> Buy Now
      </Button>
      {qty > 0 && (
        <a
          href="/cart"
          data-track="view-cart"
          className="text-center text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          {qty} in your bag · View cart ›
        </a>
      )}
    </div>
  )
}
