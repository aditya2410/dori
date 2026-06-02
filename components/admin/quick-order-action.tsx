'use client'

import { useActionState, useTransition, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2, Check } from 'lucide-react'
import { markShippedAction, markDelivered, type ShipState } from '@/app/(admin)/admin/orders/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function ShipSubmit() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending} className="shrink-0">
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : 'Confirm'}
    </Button>
  )
}

export function QuickOrderAction({ orderId, status }: { orderId: string; status: string }) {
  const [open, setOpen] = useState(false)
  const [shipped, setShipped] = useState(false)
  const [delivered, setDelivered] = useState(false)
  const [isPending, startTransition] = useTransition()

  const boundShip = markShippedAction.bind(null, orderId)
  const [state, shipAction] = useActionState<ShipState, FormData>(
    async (prev, formData) => {
      const result = await boundShip(prev, formData)
      if (!result) setShipped(true)
      return result
    },
    null,
  )

  if (status === 'paid') {
    if (shipped) {
      return (
        <span className="flex items-center gap-1 text-xs text-green-700">
          <Check className="size-3.5" /> Shipped
        </span>
      )
    }
    return (
      <div className="space-y-2">
        {!open ? (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            Mark Shipped
          </Button>
        ) : (
          <form action={shipAction} className="flex items-center gap-2">
            <Input
              name="tracking"
              placeholder="Tracking no."
              className="h-8 text-xs w-36"
              autoFocus
              required
            />
            <ShipSubmit />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </form>
        )}
        {state && 'error' in state && (
          <p className="text-xs text-destructive">{state.error}</p>
        )}
      </div>
    )
  }

  if (status === 'shipped') {
    if (delivered) {
      return (
        <span className="flex items-center gap-1 text-xs text-green-700">
          <Check className="size-3.5" /> Delivered
        </span>
      )
    }
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await markDelivered(orderId)
            setDelivered(true)
          })
        }
      >
        {isPending ? <Loader2 className="size-3.5 animate-spin" /> : 'Mark Delivered'}
      </Button>
    )
  }

  return null
}
