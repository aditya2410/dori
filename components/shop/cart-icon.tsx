'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/contexts/cart'
import { Button } from '@/components/ui/button'

export function CartIcon() {
  const { itemCount } = useCart()

  return (
    <Button variant="ghost" size="icon" className="relative" asChild>
      <Link href="/cart" aria-label={`Cart — ${itemCount} item${itemCount !== 1 ? 's' : ''}`}>
        <ShoppingBag className="size-4" />
        {itemCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-[1.1rem] items-center justify-center rounded-full bg-foreground text-background text-[10px] font-medium leading-none">
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        )}
      </Link>
    </Button>
  )
}
