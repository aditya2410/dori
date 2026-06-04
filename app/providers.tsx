'use client'

import NextTopLoader from 'nextjs-toploader'
import { CartProvider } from '@/contexts/cart'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <NextTopLoader
        color="#1a1a1a"
        height={2}
        showSpinner={false}
        easing="ease"
        speed={200}
        shadow={false}
      />
      {children}
    </CartProvider>
  )
}
