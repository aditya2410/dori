'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  markShippedAction,
  markDelivered,
  cancelOrder,
  refundOrder,
  type ShipState,
} from '@/app/(admin)/admin/orders/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface OrderActionsProps {
  orderId: string
  status: string
}

function ShipSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Saving…' : 'Confirm shipment'}
    </Button>
  )
}

export function OrderActions({ orderId, status }: OrderActionsProps) {
  const [showShipForm, setShowShipForm] = useState(false)
  const boundShip = markShippedAction.bind(null, orderId)
  const [shipState, shipAction] = useActionState<ShipState, FormData>(boundShip, null)

  // No actions once the order is in a terminal non-refundable state
  if (status === 'cancelled' || status === 'refunded') return null

  const canShip     = status === 'paid'
  const canDeliver  = status === 'paid' || status === 'shipped'
  const canRefund   = status === 'paid' || status === 'shipped' || status === 'delivered'
  const canCancel   = status === 'paid' || status === 'created'

  return (
    <div className="border p-5 space-y-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">Actions</p>

      <div className="flex flex-wrap gap-2">
        {canShip && (
          <Button
            size="sm"
            variant={showShipForm ? 'secondary' : 'default'}
            onClick={() => setShowShipForm((v) => !v)}
          >
            Mark as Shipped
          </Button>
        )}

        {canDeliver && (
          <form action={markDelivered.bind(null, orderId)}>
            <Button type="submit" size="sm" variant={canShip ? 'outline' : 'default'}>
              Mark as Delivered
            </Button>
          </form>
        )}

        {canRefund && (
          <form action={refundOrder.bind(null, orderId)}>
            <Button type="submit" size="sm" variant="outline">
              Issue Refund
            </Button>
          </form>
        )}

        {canCancel && (
          <form action={cancelOrder.bind(null, orderId)}>
            <Button type="submit" size="sm" variant="outline">
              Cancel Order
            </Button>
          </form>
        )}
      </div>

      {/* Inline ship form */}
      {showShipForm && status === 'paid' && (
        <form action={shipAction} className="space-y-3 pt-2 border-t">
          <div className="space-y-1.5">
            <Label htmlFor="tracking">Tracking number</Label>
            <Input
              id="tracking"
              name="tracking"
              placeholder="DTDC1234567890"
              autoFocus
              required
            />
          </div>
          {shipState && 'error' in shipState && (
            <p className="text-sm text-destructive">{shipState.error}</p>
          )}
          <div className="flex gap-2">
            <ShipSubmitButton />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowShipForm(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
