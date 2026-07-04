'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X, Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { welcomeOffer } from '@/lib/config'
import { submitLead, submitFeedback } from './actions'

const SEEN_KEY = 'dori_feedback_seen'
const LANDED_KEY = 'dori_landed_from'
const ORDER_PLACED_KEY = 'dori_order_placed'
const IDLE_MS = 25_000

const REASONS = [
  'Will come back later',
  'Too pricey',
  "Didn't like the bag",
  'Shipping cost / delivery time',
  'Just browsing',
  "Couldn't find what I wanted",
  'Something else',
]

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
const isPhone = (v: string) => v.replace(/[^0-9]/g, '').length >= 8

// First-touch attribution — did this session start from an Instagram/Facebook ad?
function detectLandedFrom(): string {
  try {
    const existing = sessionStorage.getItem(LANDED_KEY)
    if (existing) return existing
    const params = new URLSearchParams(window.location.search)
    const utm = (params.get('utm_source') || '').toLowerCase()
    const ref = (document.referrer || '').toLowerCase()
    let val = 'direct'
    if (utm.includes('insta') || utm === 'ig' || params.has('igshid') || ref.includes('instagram')) {
      val = 'instagram'
    } else if (utm.includes('face') || utm === 'fb' || params.has('fbclid') || ref.includes('facebook')) {
      val = 'facebook'
    } else if (ref && !ref.includes(window.location.host)) {
      val = 'referral'
    }
    sessionStorage.setItem(LANDED_KEY, val)
    return val
  } catch {
    return 'direct'
  }
}

type Step = 'capture' | 'success' | 'feedback' | 'thanks'

export function ExitIntentFeedback() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('capture')
  const [contact, setContact] = useState('')
  const [reason, setReason] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const landedRef = useRef('direct')
  const armedRef = useRef(false)

  // Never interrupt an in-progress checkout.
  const disabled = pathname.startsWith('/checkout')

  const trigger = useCallback(() => {
    if (armedRef.current) return
    try {
      // Don't ask/offer to buyers who just checked out, and only show once.
      if (sessionStorage.getItem(SEEN_KEY) || localStorage.getItem(ORDER_PLACED_KEY)) return
    } catch {}
    armedRef.current = true
    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {}
    setOpen(true)
  }, [])

  useEffect(() => {
    if (disabled) return
    landedRef.current = detectLandedFrom()
    try {
      if (sessionStorage.getItem(SEEN_KEY) || localStorage.getItem(ORDER_PLACED_KEY)) return
    } catch {}

    let idleTimer: ReturnType<typeof setTimeout>
    const resetIdle = () => {
      clearTimeout(idleTimer)
      idleTimer = setTimeout(trigger, IDLE_MS)
    }
    // Desktop: pointer exits through the top of the viewport (toward tabs/close).
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) trigger()
    }
    // Mobile: first Back press. Push a duplicate entry so Back fires popstate.
    const onPopState = () => trigger()

    const activity = ['mousemove', 'scroll', 'keydown', 'touchstart', 'click'] as const
    activity.forEach((ev) => window.addEventListener(ev, resetIdle, { passive: true }))
    document.addEventListener('mouseout', onMouseOut)
    try {
      history.pushState({ dori: 1 }, '', location.href)
    } catch {}
    window.addEventListener('popstate', onPopState)
    resetIdle()

    return () => {
      clearTimeout(idleTimer)
      activity.forEach((ev) => window.removeEventListener(ev, resetIdle))
      document.removeEventListener('mouseout', onMouseOut)
      window.removeEventListener('popstate', onPopState)
    }
  }, [disabled, trigger])

  if (!open) return null

  const fromInstagram = landedRef.current === 'instagram'

  async function claim() {
    const value = contact.trim()
    const channel = isEmail(value) ? 'email' : 'whatsapp'
    if (!isEmail(value) && !isPhone(value)) {
      setError('Enter a valid WhatsApp number or email.')
      return
    }
    setSending(true)
    setError(null)
    await submitLead({ contact: value, channel, landedFrom: landedRef.current, path: pathname })
    setSending(false)
    setStep('success')
  }

  async function sendFeedback() {
    setSending(true)
    await submitFeedback({
      reason: reason ?? undefined,
      message: message || undefined,
      landedFrom: landedRef.current,
      path: pathname,
    })
    setSending(false)
    setStep('thanks')
    setTimeout(() => setOpen(false), 1600)
  }

  function copyCode() {
    try {
      navigator.clipboard?.writeText(welcomeOffer.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md space-y-4 border bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end">
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="-m-2 p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* ── Step 1: discount capture ───────────────────────────── */}
        {step === 'capture' && (
          <div className="-mt-2 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                {fromInstagram ? 'Thanks for visiting from Instagram' : 'A little something'}
              </p>
              <h2 className="mt-1 font-serif text-2xl leading-tight">
                Here&rsquo;s {welcomeOffer.percent}% off your first order
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Drop your WhatsApp or email and we&rsquo;ll send your code — plus first dibs on new
                drops.
              </p>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                inputMode="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') claim()
                }}
                placeholder="WhatsApp number or email"
                className="w-full border bg-background px-3 py-2.5 text-sm focus:border-foreground focus:outline-none"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button
                onClick={claim}
                disabled={sending || !contact.trim()}
                className="w-full"
                data-track="exit-claim-offer"
              >
                {sending ? 'Sending…' : `Send my ${welcomeOffer.percent}% off code`}
              </Button>
            </div>
            <button
              onClick={() => setStep('feedback')}
              className="block w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              No thanks — tell them why ›
            </button>
          </div>
        )}

        {/* ── Step 2: code revealed ──────────────────────────────── */}
        {step === 'success' && (
          <div className="-mt-2 space-y-4 text-center">
            <p className="font-serif text-xl">Your code is ready 💛</p>
            <p className="text-sm text-muted-foreground">
              Use it at checkout for {welcomeOffer.percent}% off. We&rsquo;ve saved it to your
              WhatsApp/email too.
            </p>
            <button
              onClick={copyCode}
              className="flex w-full items-center justify-center gap-2 border border-dashed border-accent bg-accent/10 py-3 text-lg font-bold tracking-widest text-accent"
              data-track="exit-copy-code"
            >
              {welcomeOffer.code}
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </button>
            <Button onClick={() => setOpen(false)} className="w-full">
              Start shopping
            </Button>
          </div>
        )}

        {/* ── Fallback: quick feedback ───────────────────────────── */}
        {step === 'feedback' && (
          <div className="-mt-2 space-y-4">
            <div>
              <h2 className="font-serif text-xl leading-tight">
                {fromInstagram ? 'Before you head back to Instagram…' : 'Before you go…'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                What made you think twice today? Takes 5 seconds.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r === reason ? null : r)}
                  className={`border px-3 py-1.5 text-xs transition-colors ${
                    reason === r
                      ? 'border-foreground bg-secondary'
                      : 'border-border hover:border-foreground/40'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Anything else? (optional)"
              rows={3}
              className="w-full resize-none border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
            />
            <div className="flex items-center gap-3">
              <Button
                onClick={sendFeedback}
                disabled={sending || (!reason && !message.trim())}
                className="flex-1"
                data-track="exit-feedback-submit"
              >
                {sending ? 'Sending…' : 'Send feedback'}
              </Button>
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                No thanks
              </button>
            </div>
          </div>
        )}

        {step === 'thanks' && (
          <div className="-mt-2 space-y-2 py-6 text-center">
            <p className="font-serif text-xl">Thank you 💛</p>
            <p className="text-sm text-muted-foreground">Your note helps us make Dori better.</p>
          </div>
        )}
      </div>
    </div>
  )
}
