'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Check, Plus, Minus, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/cart'

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
  const { addItem, items, updateQuantity, removeItem } = useCart()
  const [justAdded, setJustAdded] = useState(false)

  const cartItem = items.find((i) => i.productId === product.id)
  const qty = cartItem?.quantity ?? 0

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

  if (qty === 0) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          className="w-full"
          variant="outline"
          data-track={`add-to-cart:${product.slug}`}
          onClick={() => {
            addItem({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              pricePaise: product.pricePaise,
              image: product.image,
            })
            setJustAdded(true)
            setTimeout(() => setJustAdded(false), 1500)
          }}
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
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center border">
          <button
            type="button"
            data-track={`cart-qty-decrease:${product.slug}`}
            onClick={() => qty === 1 ? removeItem(product.id) : updateQuantity(product.id, qty - 1)}
            className="px-3 py-3 hover:bg-secondary transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="size-3" />
          </button>
          <span className="px-4 text-sm font-medium min-w-[3rem] text-center">{qty}</span>
          <button
            type="button"
            data-track={`cart-qty-increase:${product.slug}`}
            onClick={() => updateQuantity(product.id, qty + 1)}
            disabled={qty >= product.stock}
            className="px-3 py-3 hover:bg-secondary transition-colors disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus className="size-3" />
          </button>
        </div>
        <Button size="lg" className="flex-1" variant="outline" asChild>
          <a href="/cart" data-track="view-cart">View Cart</a>
        </Button>
      </div>
      <Button
        size="lg"
        className="w-full"
        data-track={`buy-now:${product.slug}`}
        onClick={handleBuyNow}
      >
        <Zap className="size-4" /> Buy Now
      </Button>
    </div>
  )
}
