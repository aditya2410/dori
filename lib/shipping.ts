// Single source of truth for shipping math. The cart, the checkout summary and
// the authoritative order-create route all import from here so a customer never
// sees a shipping figure the server won't honour.

/** Flat shipping when an order is below the free-shipping threshold (₹150). */
export const DEFAULT_SHIPPING_PAISE = 15_000

/** Orders with a subtotal at or above this ship free (₹5,000). */
export const FREE_SHIPPING_THRESHOLD_PAISE = 500_000

export function qualifiesForFreeShipping(subtotalPaise: number): boolean {
  return subtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE
}

/** Paise still needed to unlock free shipping — 0 once the order qualifies. */
export function freeShippingRemainingPaise(subtotalPaise: number): number {
  return Math.max(0, FREE_SHIPPING_THRESHOLD_PAISE - subtotalPaise)
}
