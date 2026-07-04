'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/cart'
import { formatPrice } from '@/lib/utils'

interface StickyBuyBarProps {
  product: {
    id: string
    slug: string
    name: string
    pricePaise: number
    image: string | null
    stock: number
  }
}

/**
 * Mobile-only buy bar pinned to the bottom of the product page, so the
 * moment a visitor is convinced, buying is one thumb-tap away — no matter
 * how far they've scrolled. Hidden on md+ (desktop keeps inline buttons).
 */
export function StickyBuyBar({ product }: StickyBuyBarProps) {
  const router = useRouter()
  const { addItem, items } = useCart()
  const [justAdded, setJustAdded] = useState(false)

  if (product.stock === 0) return null

  const inCart = items.some((i) => i.productId === product.id)

  function addToCart() {
    if (inCart) return
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      pricePaise: product.pricePaise,
      image: product.image,
    })
  }

  return (
    <>
      {/* Spacer so page content isn't hidden behind the fixed bar */}
      <div aria-hidden className="h-24 md:hidden" />

      <div className="fixed inset-x-0 bottom-0 z-40 md:hidden border-t bg-background/95 backdrop-blur-sm px-4 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] space-y-2">
        <p className="text-center text-[10px] text-muted-foreground">
          <span aria-hidden className="text-accent">
            ✦
          </span>{' '}
          Cash on Delivery · Handcrafted in Jaipur · Ships in 3–5 days
        </p>
        <div className="flex items-stretch gap-2">
          <Button
            size="lg"
            variant="outline"
            className="flex-1 font-semibold"
            data-track={`sticky-add-to-cart:${product.slug}`}
            onClick={() => {
              addToCart()
              setJustAdded(true)
              setTimeout(() => setJustAdded(false), 1500)
            }}
          >
            {justAdded ? (
              <>
                <Check className="size-4" /> Added
              </>
            ) : (
              <>
                <ShoppingBag className="size-4" /> Add to bag
              </>
            )}
          </Button>
          <button
            type="button"
            data-track={`sticky-buy-now:${product.slug}`}
            onClick={() => {
              addToCart()
              router.push('/checkout')
            }}
            className="flex flex-[1.5] flex-col items-center justify-center leading-tight bg-primary text-primary-foreground text-sm font-semibold transition-opacity hover:opacity-90"
          >
            Buy Now
            <span className="text-[11px] font-medium opacity-75">{formatPrice(product.pricePaise)}</span>
          </button>
        </div>
      </div>
    </>
  )
}
