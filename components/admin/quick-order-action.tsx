'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { markShippedAction, markDelivered, type ShipState } from '@/app/(admin)/admin/orders/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface QuickOrderActionProps {
  orderId: string
  status: string
}

function ShipSubmit() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending} className="shrink-0">
      {pending ? '…' : 'Confirm'}
    </Button>
  )
}

export function QuickOrderAction({ orderId, status }: QuickOrderActionProps) {
  const [open, setOpen] = useState(false)
  const boundShip = markShippedAction.bind(null, orderId)
  const [state, formAction] = useActionState<ShipState, FormData>(boundShip, null)

  if (status === 'paid') {
    return (
      <div className="space-y-2">
        {!open ? (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            Mark Shipped
          </Button>
        ) : (
          <form action={formAction} className="flex items-center gap-2">
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
    return (
      <form action={markDelivered.bind(null, orderId)}>
        <Button type="submit" size="sm" variant="outline">
          Mark Delivered
        </Button>
      </form>
    )
  }

  return null
}
