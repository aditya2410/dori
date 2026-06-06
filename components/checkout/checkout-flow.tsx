'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, MapPin, Plus } from 'lucide-react'
import { useCart } from '@/contexts/cart'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { AddressForm } from '@/components/account/address-form'
import { formatPrice } from '@/lib/utils'

type Address = {
  id: string
  line1: string
  line2: string | null
  city: string
  state: string
  pincode: string
  country: string
  is_default: boolean
}

interface CheckoutFlowProps {
  addresses: Address[]
  userEmail: string
  userName: string
  userPhone: string
}

type Step = 'address' | 'review'

// Must match the server-side value in api/orders/create
const SHIPPING_PAISE = 15_000

function calcShipping(_subtotalPaise: number) {
  return SHIPPING_PAISE
}

export function CheckoutFlow({ addresses, userEmail, userName, userPhone }: CheckoutFlowProps) {
  const router = useRouter()
  const { items, totalPaise: subtotalPaise, clearCart, isHydrated } = useCart()

  const [step, setStep] = useState<Step>('address')
  const [selectedId, setSelectedId] = useState<string>(
    addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? '',
  )
  const [showAddForm, setShowAddForm] = useState(addresses.length === 0)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shippingPaise = calcShipping(subtotalPaise)
  const totalPaise = subtotalPaise + shippingPaise
  const selectedAddress = addresses.find((a) => a.id === selectedId)

  if (!isHydrated) {
    return <div className="min-h-screen" />
  }

  if (items.length === 0) {
    return (
      <div className="container py-24 text-center space-y-4">
        <h1 className="font-serif text-3xl font-normal">Your cart is empty</h1>
        <Button asChild>
          <Link href="/products">Shop now</Link>
        </Button>
      </div>
    )
  }

  async function loadRazorpayScript(): Promise<void> {
    if (window.Razorpay) return
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Razorpay script'))
      document.head.appendChild(script)
    })
  }

  async function handlePay() {
    if (!selectedId) return
    setProcessing(true)
    setError(null)

    // 0. Ensure Razorpay script is loaded
    try {
      await loadRazorpayScript()
    } catch {
      setError('Could not load payment SDK. Check your connection and try again.')
      setProcessing(false)
      return
    }

    // 1. Create order
    let orderData: {
      orderId: string
      orderNumber: string
      razorpayOrderId: string
      amountPaise: number
      keyId: string
    }

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId: selectedId,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to create order.')
        setProcessing(false)
        return
      }
      orderData = json
    } catch {
      setError('Network error. Please try again.')
      setProcessing(false)
      return
    }

    // 2. Open Razorpay modal
    const rzp = new window.Razorpay({
      key: orderData.keyId,
      amount: orderData.amountPaise,
      currency: 'INR',
      name: 'DORI',
      description: `Order ${orderData.orderNumber}`,
      order_id: orderData.razorpayOrderId,
      prefill: { name: userName, email: userEmail, contact: userPhone },
      theme: { color: '#1a1a1a' },
      modal: {
        ondismiss: () => {
          setProcessing(false)
          // Cancel the pending order so stock is restored and it doesn't
          // appear as "Awaiting Payment" in the user's order history.
          fetch(`/api/orders/${orderData.orderId}/cancel`, { method: 'POST' }).catch(() => {})
        },
      },
      handler: async (response) => {
        // 3. Verify payment
        try {
          const verifyRes = await fetch('/api/orders/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: orderData.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          })
          if (verifyRes.ok) {
            clearCart()
            router.push(`/order-confirmation/${orderData.orderId}`)
          } else {
            const j = await verifyRes.json()
            setError(j.error ?? 'Payment verification failed.')
            setProcessing(false)
          }
        } catch {
          setError('Verification failed. Please contact support.')
          setProcessing(false)
        }
      },
    })
    rzp.open()
  }

  return (
    <div className="min-h-screen">
      {/* Minimal header */}
      <header className="pt-4 pb-3">
        <div className="container flex items-center justify-between">
          <Link href="/" aria-label="Dori Jaipur" className="font-serif text-base tracking-[0.15em] uppercase hover:opacity-70 transition-opacity">
            <span className="hidden sm:inline">Dori Jaipur</span>
            <span className="sm:hidden">Dori</span>
          </Link>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={step === 'address' ? 'text-foreground font-medium' : ''}>Address</span>
              <span>›</span>
              <span className={step === 'review' ? 'text-foreground font-medium' : ''}>Review</span>
            </div>
            <div className="h-px w-10 bg-border" />
          </div>
          <div className="w-16" />
        </div>
      </header>

      <div className="container py-12 max-w-2xl">
        {/* ── STEP 1: ADDRESS ──────────────────────────────────── */}
        {step === 'address' && (
          <div className="space-y-8">
            <h1 className="font-serif text-3xl font-normal">Delivery Address</h1>

            {addresses.length > 0 && (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-4 border p-4 cursor-pointer transition-colors ${
                      selectedId === addr.id ? 'border-foreground' : 'hover:border-foreground/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={addr.id}
                      checked={selectedId === addr.id}
                      onChange={() => { setSelectedId(addr.id); setShowAddForm(false) }}
                      className="mt-0.5 accent-foreground"
                    />
                    <div className="text-sm leading-relaxed">
                      <p className="font-medium">{addr.line1}</p>
                      {addr.line2 && <p className="text-muted-foreground">{addr.line2}</p>}
                      <p className="text-muted-foreground">
                        {addr.city}, {addr.state} {addr.pincode}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {!showAddForm ? (
              <button
                type="button"
                onClick={() => { setShowAddForm(true); setSelectedId('') }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="size-4" />
                Add new address
              </button>
            ) : (
              <div className="space-y-4">
                <h2 className="font-serif text-xl font-normal">New Address</h2>
                <AddressForm
                  submitLabel="Save & use this address"
                  onSuccess={() => {
                    setShowAddForm(false)
                    // Page will revalidate and refetch addresses
                    window.location.reload()
                  }}
                />
                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}

            {!showAddForm && (
              <Button
                size="lg"
                className="w-full"
                data-track="checkout-continue-to-review"
                disabled={!selectedId}
                onClick={() => setStep('review')}
              >
                Continue to Review
              </Button>
            )}
          </div>
        )}

        {/* ── STEP 2: REVIEW ──────────────────────────────────── */}
        {step === 'review' && (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep('address')}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Back to address"
              >
                <ChevronLeft className="size-5" />
              </button>
              <h1 className="font-serif text-3xl font-normal">Review Order</h1>
            </div>

            {/* Shipping address */}
            {selectedAddress && (
              <div className="border p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="size-3" /> Delivering to
                  </p>
                  <button
                    onClick={() => setStep('address')}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Change
                  </button>
                </div>
                <p className="text-sm font-medium">{selectedAddress.line1}</p>
                {selectedAddress.line2 && (
                  <p className="text-sm text-muted-foreground">{selectedAddress.line2}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}
                </p>
              </div>
            )}

            {/* Items */}
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-4">
                  <div className="w-14 aspect-[3/4] bg-secondary overflow-hidden relative shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="56px"
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full bg-secondary" />
                    )}
                  </div>
                  <div className="flex-1 flex justify-between text-sm">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">{formatPrice(item.pricePaise * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotalPaise)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shippingPaise === 0 ? 'Free' : formatPrice(shippingPaise)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium text-base">
                <span>Total</span>
                <span>{formatPrice(totalPaise)}</span>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              size="lg"
              className="w-full"
              data-track="checkout-pay"
              onClick={handlePay}
              disabled={processing}
            >
              {processing ? 'Processing…' : `Pay ${formatPrice(totalPaise)}`}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Secured by Razorpay · Your card is never stored
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
