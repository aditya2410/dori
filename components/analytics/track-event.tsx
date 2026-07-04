'use client'

import { useEffect, useRef } from 'react'
import { trackMeta } from './meta-pixel'

/** Fires Meta ViewContent once when a product page mounts. */
export function TrackViewContent({
  id,
  name,
  value,
}: {
  id: string
  name: string
  value: number
}) {
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    trackMeta('ViewContent', {
      content_ids: [id],
      content_name: name,
      content_type: 'product',
      value,
      currency: 'INR',
    })
  }, [id, name, value])
  return null
}

/** Fires Meta Purchase once per order (guarded so a refresh won't double-count). */
export function TrackPurchase({
  orderId,
  orderNumber,
  value,
  contentIds,
}: {
  orderId: string
  orderNumber: string
  value: number
  contentIds: string[]
}) {
  useEffect(() => {
    const key = `meta_purchase_${orderId}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      /* ignore */
    }
    trackMeta('Purchase', {
      value,
      currency: 'INR',
      content_type: 'product',
      content_ids: contentIds,
      order_id: orderNumber,
      num_items: contentIds.length,
    })
  }, [orderId, orderNumber, value, contentIds])
  return null
}
