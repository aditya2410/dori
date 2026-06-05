'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, X } from 'lucide-react'
import { useCart } from '@/contexts/cart'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/utils'

const SHIPPING_PAISE = 15_000

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPaise, itemCount, isHydrated } = useCart()

  if (!isHydrated) {
    return <div className="container py-24" />
  }

  if (itemCount === 0) {
    return (
      <div className="container py-24 text-center space-y-5">
        <h1 className="font-serif text-4xl font-normal">Your cart is empty</h1>
        <p className="text-muted-foreground text-sm">
          Nothing here yet — explore our collection.
        </p>
        <Button asChild size="lg">
          <Link href="/products">Shop now</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-8 md:py-16">
      <h1 className="font-serif text-4xl font-normal mb-12">
        Cart{' '}
        <span className="font-sans text-lg font-normal text-muted-foreground">
          ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-16 items-start">
        {/* Items */}
        <div>
          {items.map((item, i) => (
            <div key={item.productId}>
              <div className="flex gap-5 py-6">
                <Link href={`/products/${item.slug}`} className="shrink-0">
                  <div className="w-20 aspect-[3/4] bg-secondary overflow-hidden relative">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="80px"
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <span className="font-serif text-xs text-muted-foreground">DORI</span>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="flex-1 flex flex-col gap-3 min-w-0">
                  <div className="flex justify-between gap-2">
                    <Link
                      href={`/products/${item.slug}`}
                      className="hover:opacity-70 transition-opacity"
                    >
                      <h3 className="text-sm font-medium leading-tight">{item.name}</h3>
                    </Link>
                    <button
                      onClick={() => removeItem(item.productId)}
                      data-track={`cart-remove:${item.slug}`}
                      className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
                      aria-label="Remove item"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {formatPrice(item.pricePaise)}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center border">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        data-track={`cart-qty-decrease:${item.slug}`}
                        className="px-2.5 py-1.5 hover:bg-secondary transition-colors"
                        aria-label="Decrease"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="px-3 text-sm min-w-[2.5rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        data-track={`cart-qty-increase:${item.slug}`}
                        className="px-2.5 py-1.5 hover:bg-secondary transition-colors"
                        aria-label="Increase"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                    <p className="text-sm font-medium">
                      {formatPrice(item.pricePaise * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
              {i < items.length - 1 && <Separator />}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="space-y-6 border p-6 lg:sticky lg:top-8">
          <h2 className="font-serif text-xl font-normal">Order Summary</h2>
          <Separator />

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(totalPaise)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{formatPrice(SHIPPING_PAISE)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{formatPrice(totalPaise + SHIPPING_PAISE)}</span>
          </div>

          <Button size="lg" className="w-full" asChild>
            <Link href="/checkout" data-track="proceed-to-checkout">Proceed to Checkout</Link>
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            ₹150 flat shipping · Shipped in 3–5 days
          </p>
        </div>
      </div>
    </div>
  )
}
