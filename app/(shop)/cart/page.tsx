'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, X } from 'lucide-react'
import { useCart } from '@/contexts/cart'
import { createClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/utils'
import {
  DEFAULT_SHIPPING_PAISE,
  FREE_SHIPPING_THRESHOLD_PAISE,
  freeShippingRemainingPaise,
  qualifiesForFreeShipping,
} from '@/lib/shipping'

type Upsell = {
  id: string
  slug: string
  name: string
  price_paise: number
  images: unknown
  stock: number
}

export default function CartPage() {
  const { items, addItem, removeItem, updateQuantity, totalPaise, itemCount, isHydrated } = useCart()

  // Low-cost add-ons to nudge cart value (and toward free shipping). We pull the
  // cheapest in-stock products and drop anything already in the cart.
  const [upsells, setUpsells] = useState<Upsell[]>([])
  useEffect(() => {
    let active = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createClient() as any
    db.from('products')
      .select('id, slug, name, price_paise, images, stock')
      .eq('is_active', true)
      .gt('stock', 0)
      .order('price_paise', { ascending: true })
      .limit(6)
      .then(({ data }: { data: Upsell[] | null }) => {
        if (active) setUpsells(data ?? [])
      })
    return () => {
      active = false
    }
  }, [])

  const inCartIds = new Set(items.map((i) => i.productId))
  const suggestions = upsells.filter((p) => !inCartIds.has(p.id)).slice(0, 2)

  const freeShipping = qualifiesForFreeShipping(totalPaise)
  const shippingPaise = freeShipping ? 0 : DEFAULT_SHIPPING_PAISE
  const remainingPaise = freeShippingRemainingPaise(totalPaise)
  const progressPct = Math.min(100, Math.round((totalPaise / FREE_SHIPPING_THRESHOLD_PAISE) * 100))

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
      <h1 className="font-serif text-4xl font-normal mb-8">
        Cart{' '}
        <span className="font-sans text-lg font-normal text-muted-foreground">
          ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </span>
      </h1>

      {/* Free-shipping progress — honest, threshold-based nudge (gold box, per design) */}
      <div className="mb-12 max-w-xl space-y-2 border border-accent/30 bg-accent/10 px-3.5 py-3">
        <p className="text-sm text-accent">
          {freeShipping ? (
            <span className="font-semibold">
              <span aria-hidden>✦</span> You&rsquo;ve unlocked free shipping
            </span>
          ) : (
            <>
              You&rsquo;re{' '}
              <span className="font-semibold">{formatPrice(remainingPaise)}</span> away from{' '}
              <span className="font-semibold">free shipping</span>
            </>
          )}
        </p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent/20">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

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

          {/* Pairs-beautifully-with upsells */}
          {suggestions.length > 0 && (
            <div className="mt-10 border-t pt-6">
              <p className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">
                Pairs beautifully with
              </p>
              <div className="space-y-3">
                {suggestions.map((p) => {
                  const imgs = Array.isArray(p.images) ? (p.images as string[]) : []
                  const image = imgs[0] ?? null
                  return (
                    <div key={p.id} className="flex items-center gap-4">
                      <Link href={`/products/${p.slug}`} className="shrink-0">
                        <div className="relative w-14 aspect-[3/4] overflow-hidden bg-secondary">
                          {image ? (
                            <Image src={image} alt={p.name} fill sizes="56px" unoptimized className="object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <span className="font-serif text-[10px] text-muted-foreground">DORI</span>
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${p.slug}`}
                          className="text-sm font-medium leading-tight hover:opacity-70 transition-opacity"
                        >
                          {p.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">{formatPrice(p.price_paise)}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        data-track={`cart-upsell-add:${p.slug}`}
                        onClick={() =>
                          addItem({
                            productId: p.id,
                            slug: p.slug,
                            name: p.name,
                            pricePaise: p.price_paise,
                            image,
                          })
                        }
                      >
                        <Plus className="size-3" /> Add
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
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
              <span>{shippingPaise === 0 ? 'Free' : formatPrice(shippingPaise)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{formatPrice(totalPaise + shippingPaise)}</span>
          </div>

          <Button size="lg" className="w-full" asChild>
            <Link href="/checkout" data-track="proceed-to-checkout">Proceed to Checkout</Link>
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            {freeShipping
              ? 'Free shipping unlocked · Shipped in 3–5 days'
              : `₹150 flat shipping · Free over ${formatPrice(FREE_SHIPPING_THRESHOLD_PAISE)} · Shipped in 3–5 days`}
          </p>
        </div>
      </div>
    </div>
  )
}
