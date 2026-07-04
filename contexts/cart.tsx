'use client'

import { createContext, useContext, useEffect, useReducer, useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'

export interface CartItem {
  productId: string
  slug: string
  name: string
  pricePaise: number
  image: string | null
  quantity: number
}

type CartAction =
  | { type: 'LOAD'; items: CartItem[] }
  | { type: 'MERGE_DB'; items: CartItem[] }
  | { type: 'ADD'; item: CartItem }
  | { type: 'REMOVE'; productId: string }
  | { type: 'UPDATE_QTY'; productId: string; quantity: number }
  | { type: 'CLEAR' }

function reducer(items: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'LOAD':
      return action.items
    case 'MERGE_DB': {
      // DB is canonical for existing items; preserve local-only items
      const dbIds = new Set(action.items.map((i) => i.productId))
      const localOnly = items.filter((i) => !dbIds.has(i.productId))
      return [...action.items, ...localOnly]
    }
    case 'ADD': {
      const idx = items.findIndex((i) => i.productId === action.item.productId)
      // Already in the bag — add another unit (each click adds one).
      if (idx >= 0) {
        return items.map((i, n) =>
          n === idx ? { ...i, quantity: i.quantity + action.item.quantity } : i,
        )
      }
      return [...items, action.item]
    }
    case 'REMOVE':
      return items.filter((i) => i.productId !== action.productId)
    case 'UPDATE_QTY':
      if (action.quantity <= 0) return items.filter((i) => i.productId !== action.productId)
      return items.map((i) =>
        i.productId === action.productId ? { ...i, quantity: action.quantity } : i,
      )
    case 'CLEAR':
      return []
  }
}

interface CartContextValue {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  itemCount: number
  totalPaise: number
  isHydrated: boolean
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'dori_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, dispatch] = useReducer(reducer, [])
  const [userId, setUserId] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  // createClient() is intentionally called inside useEffect only —
  // createBrowserClient accesses browser APIs and must not run during SSR.

  // ── 1. Hydrate from localStorage on mount ──────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) dispatch({ type: 'LOAD', items: JSON.parse(raw) })
    } catch {}
    setIsHydrated(true)
  }, [])

  // ── 2. Watch auth state; load DB cart on login ─────────────
  useEffect(() => {
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)

      if (uid && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        type CartRow = { product_id: string; quantity: number }
        type ProductRow = { id: string; slug: string; name: string; price_paise: number; images: unknown }

        const cartResult = await supabase.from('cart_items').select('product_id, quantity').eq('user_id', uid)
        const cartRows = cartResult.data as CartRow[] | null

        if (cartRows?.length) {
          const productIds = cartRows.map((r) => r.product_id)
          const prodResult = await supabase.from('products').select('id, slug, name, price_paise, images').in('id', productIds)
          const products = prodResult.data as ProductRow[] | null

          const productMap = new Map((products ?? []).map((p) => [p.id, p]))
          const loaded: CartItem[] = []
          for (const row of cartRows) {
            const p = productMap.get(row.product_id)
            if (!p) continue
            const imgs = Array.isArray(p.images) ? (p.images as string[]) : []
            loaded.push({
              productId: row.product_id,
              slug: p.slug,
              name: p.name,
              pricePaise: p.price_paise,
              image: imgs[0] ?? null,
              quantity: row.quantity,
            })
          }
          dispatch({ type: 'MERGE_DB', items: loaded })
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── 3. Persist to localStorage on every change ────────────
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  // ── 4. Debounced DB sync for logged-in users ───────────────
  useEffect(() => {
    if (!userId) return
    // Cast to any: @supabase/ssr's createBrowserClient has a known type inference
    // limitation where .from() returns never. Runtime is correct.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createClient() as any
    const handle = window.setTimeout(async () => {
      await db.from('cart_items').delete().eq('user_id', userId)
      if (items.length > 0) {
        await db.from('cart_items').upsert(
          items.map((i) => ({
            user_id: userId,
            product_id: i.productId,
            quantity: i.quantity,
          })),
        )
      }
    }, 800)
    return () => window.clearTimeout(handle)
  }, [items, userId])

  // ── Actions ───────────────────────────────────────────────
  const addItem = useCallback(
    (item: Omit<CartItem, 'quantity'>, qty = 1) =>
      dispatch({ type: 'ADD', item: { ...item, quantity: qty } }),
    [],
  )
  const removeItem = useCallback(
    (productId: string) => dispatch({ type: 'REMOVE', productId }),
    [],
  )
  const updateQuantity = useCallback(
    (productId: string, quantity: number) =>
      dispatch({ type: 'UPDATE_QTY', productId, quantity }),
    [],
  )
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), [])

  const itemCount = items.reduce((s, i) => s + i.quantity, 0)
  const totalPaise = items.reduce((s, i) => s + i.pricePaise * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, totalPaise, isHydrated }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
