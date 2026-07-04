'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { submitFeedback } from './actions'

const SEEN_KEY = 'dori_feedback_seen'
const LANDED_KEY = 'dori_landed_from'
const ORDER_PLACED_KEY = 'dori_order_placed'

const REASONS = [
  'Will come back later',
  'Too pricey',
  "Didn't like the bag",
  'Shipping cost / delivery time',
  'Just browsing',
  "Couldn't find what I wanted",
  'Something else',
]

// First-touch attribution for the session — records whether this visit came
// from an Instagram/Facebook ad so we can read the feedback in context.
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

export function ExitIntentFeedback() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const landedRef = useRef('direct')
  const armedRef = useRef(false)

  // Never interrupt an in-progress checkout.
  const disabled = pathname.startsWith('/checkout')

  const trigger = useCallback(() => {
    if (armedRef.current) return
    try {
      // Don't ask happy customers who just checked out, and only ask once.
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

    // Desktop: pointer exits through the top of the viewport.
    function onMouseOut(e: MouseEvent) {
      if (e.clientY <= 0 && !e.relatedTarget) trigger()
    }
    // Mobile: catch the first Back press. Push a duplicate history entry so
    // Back fires popstate (staying on the page) instead of leaving immediately.
    function onPopState() {
      trigger()
    }
    document.addEventListener('mouseout', onMouseOut)
    try {
      history.pushState({ dori: 1 }, '', location.href)
    } catch {}
    window.addEventListener('popstate', onPopState)

    return () => {
      document.removeEventListener('mouseout', onMouseOut)
      window.removeEventListener('popstate', onPopState)
    }
  }, [disabled, trigger])

  if (!open) return null

  const fromInstagram = landedRef.current === 'instagram'

  async function send() {
    setSending(true)
    await submitFeedback({
      reason: reason ?? undefined,
      message: message || undefined,
      landedFrom: landedRef.current,
      path: pathname,
    })
    setSending(false)
    setSubmitted(true)
    setTimeout(() => setOpen(false), 1600)
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
        {submitted ? (
          <div className="space-y-2 py-6 text-center">
            <p className="font-serif text-xl">Thank you 💛</p>
            <p className="text-sm text-muted-foreground">Your note helps us make Dori better.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl leading-tight">
                  {fromInstagram ? 'Before you head back to Instagram…' : 'Before you go…'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  What made you think twice today? Takes 5 seconds.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
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
                onClick={send}
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
          </>
        )}
      </div>
    </div>
  )
}
