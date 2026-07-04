'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Zap, Lock } from 'lucide-react'
import { useCart } from '@/contexts/cart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { AddressForm } from '@/components/account/address-form'
import { formatPrice } from '@/lib/utils'
import { COD_FEE_PAISE, isCodEligible } from '@/lib/cod'
import { DEFAULT_SHIPPING_PAISE, qualifiesForFreeShipping } from '@/lib/shipping'
import { trackMeta } from '@/components/analytics/meta-pixel'

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
  isGuest: boolean
  addresses: Address[]
  userEmail: string
  userName: string
  userPhone: string
}

// Mirrors the authoritative calc in api/orders/create (via lib/shipping).
function calcShipping(subtotalPaise: number) {
  if (qualifiesForFreeShipping(subtotalPaise)) return 0
  return DEFAULT_SHIPPING_PAISE
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export function CheckoutFlow({ isGuest, addresses, userEmail, userName, userPhone }: CheckoutFlowProps) {
  const router = useRouter()
  const { items, totalPaise: subtotalPaise, clearCart, removeItem, isHydrated } = useCart()

  const [selectedId, setSelectedId] = useState<string>(
    addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? '',
  )
  const [showAddForm, setShowAddForm] = useState(addresses.length === 0)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay')

  // Guest details (no account required)
  const [guest, setGuest] = useState({
    email: '', full_name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '',
  })
  const setG = (k: keyof typeof guest) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setGuest((g) => ({ ...g, [k]: e.target.value }))
  const guestValid =
    isEmail(guest.email) && !!guest.full_name && !!guest.phone &&
    !!guest.line1 && !!guest.city && !!guest.state && !!guest.pincode

  // Billing address — defaults to "same as delivery"
  const [billingSame, setBillingSame] = useState(true)
  const [billing, setBilling] = useState({
    full_name: '', line1: '', line2: '', city: '', state: '', pincode: '',
  })
  const setB = (k: keyof typeof billing) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setBilling((b) => ({ ...b, [k]: e.target.value }))
  const billingValid =
    billingSame ||
    (!!billing.full_name && !!billing.line1 && !!billing.city && !!billing.state && !!billing.pincode)

  // Promo / sale code
  const [codeInput, setCodeInput] = useState('')
  const [appliedCode, setAppliedCode] = useState<string | null>(null)
  const [discountPaise, setDiscountPaise] = useState(0)
  const [freeShipping, setFreeShipping] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)

  const shippingPaise = freeShipping ? 0 : calcShipping(subtotalPaise)
  // Order value the COD cap is checked against — before any COD handling fee.
  const preFeeTotalPaise = subtotalPaise - discountPaise + shippingPaise
  const codAvailable = isCodEligible(preFeeTotalPaise)
  const codFeePaise = paymentMethod === 'cod' ? COD_FEE_PAISE : 0
  const totalPaise = preFeeTotalPaise + codFeePaise

  // If a discount is removed (or the cart changes) so the order crosses the cap,
  // fall back to Pay Online — mirrors the server refusing COD above the cap.
  useEffect(() => {
    if (!codAvailable && paymentMethod === 'cod') setPaymentMethod('razorpay')
  }, [codAvailable, paymentMethod])

  // Fire InitiateCheckout once, after the cart hydrates.
  const initiateFired = useRef(false)
  useEffect(() => {
    if (initiateFired.current || !isHydrated || items.length === 0) return
    initiateFired.current = true
    trackMeta('InitiateCheckout', {
      value: subtotalPaise / 100,
      currency: 'INR',
      num_items: items.reduce((sum, i) => sum + i.quantity, 0),
      content_ids: items.map((i) => i.productId),
    })
  }, [isHydrated, items, subtotalPaise])

  const addressValid = isGuest ? guestValid : !!selectedId
  const canPay = addressValid && billingValid

  async function applyCode() {
    const code = codeInput.trim()
    if (!code) return
    setApplying(true)
    setCodeError(null)
    try {
      const res = await fetch('/api/sales/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setCodeError(json.error ?? 'Could not apply code.')
        setAppliedCode(null)
        setDiscountPaise(0)
        setFreeShipping(false)
      } else {
        setAppliedCode(json.code)
        setDiscountPaise(json.discountPaise)
        setFreeShipping(json.freeShipping ?? false)
        setCodeInput(json.code)
      }
    } catch {
      setCodeError('Network error. Please try again.')
    } finally {
      setApplying(false)
    }
  }

  function removeCode() {
    setAppliedCode(null)
    setDiscountPaise(0)
    setFreeShipping(false)
    setCodeInput('')
    setCodeError(null)
  }

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
    if (!canPay) return
    const isCod = paymentMethod === 'cod'
    setProcessing(true)
    setError(null)

    // 0. Ensure Razorpay script is loaded (prepaid only)
    if (!isCod) {
      try {
        await loadRazorpayScript()
      } catch {
        setError('Could not load payment SDK. Check your connection and try again.')
        setProcessing(false)
        return
      }
    }

    // 1. Create order
    let orderData: {
      orderId: string
      orderNumber: string
      razorpayOrderId?: string
      amountPaise: number
      keyId?: string
    }

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          paymentMethod,
          ...(isGuest
            ? { guest: { ...guest, line2: guest.line2 || undefined } }
            : { addressId: selectedId }),
          ...(!billingSame ? { billing: { ...billing, line2: billing.line2 || undefined } } : {}),
          ...(appliedCode ? { saleCode: appliedCode } : {}),
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

    // 2a. COD — order is already confirmed server-side; go to confirmation.
    if (isCod) {
      clearCart()
      try { localStorage.setItem('dori_order_placed', '1') } catch {}
      router.push(`/order-confirmation/${orderData.orderId}`)
      return
    }

    // 2b. Open Razorpay modal (prepaid)
    const rzp = new window.Razorpay({
      key: orderData.keyId!,
      amount: orderData.amountPaise,
      currency: 'INR',
      name: 'DORI',
      description: `Order ${orderData.orderNumber}`,
      order_id: orderData.razorpayOrderId!,
      prefill: isGuest
        ? { name: guest.full_name, email: guest.email, contact: guest.phone }
        : { name: userName, email: userEmail, contact: userPhone },
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
            try { localStorage.setItem('dori_order_placed', '1') } catch {}
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
      {/* Header */}
      <header className="border-b border-border/60 py-5">
        <div className="container flex justify-center">
          <Link href="/" aria-label="Dori Jaipur" className="font-serif text-xl tracking-[0.2em] uppercase hover:opacity-70 transition-opacity">
            Dori Jaipur
          </Link>
        </div>
      </header>

      <div className="container py-12 max-w-2xl space-y-10">
        <h1 className="font-serif text-3xl font-normal">Checkout</h1>

        {/* ── Express payment (leads the page — the biggest drop-off lever) ── */}
        <section className="space-y-3">
          <span className="block text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Fastest — pay in seconds
          </span>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setPaymentMethod('razorpay')}
              data-track="checkout-select-razorpay"
              className={`flex flex-1 h-12 items-center justify-center gap-2 border text-sm font-semibold transition-colors ${
                paymentMethod === 'razorpay'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-foreground/30 hover:border-foreground'
              }`}
            >
              <Zap className="size-4" /> UPI / GPay · Cards
            </button>
            {codAvailable && (
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                data-track="checkout-select-cod"
                className={`flex flex-1 flex-col items-center justify-center leading-tight h-12 border text-sm font-semibold transition-colors ${
                  paymentMethod === 'cod'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-foreground/30 hover:border-foreground'
                }`}
              >
                Cash on Delivery
                <span
                  className={`text-[10px] font-medium ${
                    paymentMethod === 'cod' ? 'opacity-75' : 'text-muted-foreground'
                  }`}
                >
                  Pay when it arrives
                </span>
              </button>
            )}
          </div>
          {!codAvailable && (
            <p className="text-xs text-muted-foreground">
              Cash on Delivery isn&rsquo;t available for orders of this value — please pay online.
            </p>
          )}
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock aria-hidden className="size-3 text-[#1f7a4d]" /> 100% secure payments via Razorpay
          </p>
        </section>

        {/* OR ENTER DETAILS divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Or enter details</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* ── Delivery address ──────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Delivery address</h2>

          {isGuest ? (
            /* Guest details — no account/sign-in required */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="g-email">Email</Label>
                <Input id="g-email" type="email" autoComplete="email" placeholder="you@example.com" value={guest.email} onChange={setG('email')} required />
                <p className="text-xs text-muted-foreground">Order updates go here, and you can track orders later with a login code.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="g-name">Full name</Label>
                  <Input id="g-name" autoComplete="name" placeholder="Priya Sharma" value={guest.full_name} onChange={setG('full_name')} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="g-phone">Phone number</Label>
                  <Input id="g-phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" value={guest.phone} onChange={setG('phone')} required />
                </div>
              </div>
              <Separator />
              <div className="space-y-1.5">
                <Label htmlFor="g-line1">Address line 1</Label>
                <Input id="g-line1" placeholder="Building, street" value={guest.line1} onChange={setG('line1')} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-line2">Line 2 <span className="text-muted-foreground font-normal normal-case tracking-normal">(optional)</span></Label>
                <Input id="g-line2" placeholder="Apartment, floor, landmark" value={guest.line2} onChange={setG('line2')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="g-city">City</Label>
                  <Input id="g-city" placeholder="Mumbai" value={guest.city} onChange={setG('city')} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="g-state">State</Label>
                  <Input id="g-state" placeholder="Maharashtra" value={guest.state} onChange={setG('state')} required />
                </div>
              </div>
              <div className="space-y-1.5 max-w-[160px]">
                <Label htmlFor="g-pincode">Pincode</Label>
                <Input id="g-pincode" maxLength={6} placeholder="400001" value={guest.pincode} onChange={setG('pincode')} required />
              </div>

              <p className="text-xs text-muted-foreground">
                Have an account?{' '}
                <Link href="/login?next=/checkout" className="text-foreground underline underline-offset-4 hover:opacity-70">Sign in</Link>{' '}
                to use a saved address.
              </p>
            </div>
          ) : (
            <>
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
                  <h3 className="font-serif text-xl font-normal">New Address</h3>
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
            </>
          )}
        </section>

        {/* ── Billing address ───────────────────────────────────── */}
        <section className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={billingSame}
              onChange={(e) => setBillingSame(e.target.checked)}
              className="h-4 w-4 accent-foreground"
            />
            <span className="text-sm">Billing address same as delivery</span>
          </label>

          {!billingSame && (
            <div className="space-y-4 border-l-2 border-border pl-4">
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Billing address</h2>
              <div className="space-y-1.5">
                <Label htmlFor="b-name">Full name</Label>
                <Input id="b-name" autoComplete="name" placeholder="Priya Sharma" value={billing.full_name} onChange={setB('full_name')} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-line1">Address line 1</Label>
                <Input id="b-line1" placeholder="Building, street" value={billing.line1} onChange={setB('line1')} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-line2">Line 2 <span className="text-muted-foreground font-normal normal-case tracking-normal">(optional)</span></Label>
                <Input id="b-line2" placeholder="Apartment, floor, landmark" value={billing.line2} onChange={setB('line2')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="b-city">City</Label>
                  <Input id="b-city" placeholder="Mumbai" value={billing.city} onChange={setB('city')} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="b-state">State</Label>
                  <Input id="b-state" placeholder="Maharashtra" value={billing.state} onChange={setB('state')} required />
                </div>
              </div>
              <div className="space-y-1.5 max-w-[160px]">
                <Label htmlFor="b-pincode">Pincode</Label>
                <Input id="b-pincode" maxLength={6} placeholder="400001" value={billing.pincode} onChange={setB('pincode')} required />
              </div>
            </div>
          )}
        </section>

        <Separator />

        {/* ── Order summary ─────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Order summary</h2>
          {items.map((item) => (
            <div key={item.productId} className="flex gap-4">
              <div className="w-14 aspect-[3/4] bg-secondary overflow-hidden relative shrink-0">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill sizes="56px" unoptimized className="object-cover" />
                ) : (
                  <div className="h-full bg-secondary" />
                )}
              </div>
              <div className="flex-1 flex justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-muted-foreground">Qty: {item.quantity}</p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="mt-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Remove
                  </button>
                </div>
                <p className="font-medium whitespace-nowrap">{formatPrice(item.pricePaise * item.quantity)}</p>
              </div>
            </div>
          ))}
        </section>

        <Separator />

        {/* ── Promo / sale code ─────────────────────────────────── */}
        <div className="space-y-2">
          {appliedCode ? (
            <div className="flex items-center justify-between border border-foreground/20 bg-secondary/40 px-3 py-2 text-sm">
              <span>
                Code <span className="font-medium">{appliedCode}</span> applied
                {freeShipping && <span className="text-muted-foreground"> · free shipping</span>}
              </span>
              <button
                type="button"
                onClick={removeCode}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCode() } }}
                placeholder="Promo code"
                className="flex-1 border bg-background px-3 py-2 text-sm uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:border-foreground"
              />
              <Button type="button" variant="outline" onClick={applyCode} disabled={applying || !codeInput.trim()}>
                {applying ? 'Applying…' : 'Apply'}
              </Button>
            </div>
          )}
          {codeError && <p className="text-xs text-destructive">{codeError}</p>}
        </div>

        {/* ── Totals ────────────────────────────────────────────── */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(subtotalPaise)}</span>
          </div>
          {discountPaise > 0 && (
            <div className="flex justify-between text-foreground">
              <span className="text-muted-foreground">Discount{appliedCode ? ` (${appliedCode})` : ''}</span>
              <span>−{formatPrice(discountPaise)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>{shippingPaise === 0 ? 'Free' : formatPrice(shippingPaise)}</span>
          </div>
          {codFeePaise > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">COD handling fee</span>
              <span>{formatPrice(codFeePaise)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-medium text-base">
            <span>Total</span>
            <span>{formatPrice(totalPaise)}</span>
          </div>
        </div>

        <Separator />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          size="lg"
          className="w-full"
          data-track="checkout-pay"
          onClick={handlePay}
          disabled={!canPay || processing}
        >
          {processing
            ? 'Processing…'
            : paymentMethod === 'cod'
              ? `Place Order · Pay ${formatPrice(totalPaise)} on delivery`
              : `Pay ${formatPrice(totalPaise)}`}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          {paymentMethod === 'cod'
            ? 'Please keep exact change ready for delivery'
            : 'Secured by Razorpay · Your card is never stored'}
        </p>
      </div>
    </div>
  )
}
