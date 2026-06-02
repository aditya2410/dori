'use client'

import { useActionState, useOptimistic, useTransition, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import {
  markShippedAction,
  markDelivered,
  cancelOrder,
  refundOrder,
  type ShipState,
  type RefundState,
} from '@/app/(admin)/admin/orders/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function ShipSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
      {pending ? 'Saving…' : 'Confirm shipment'}
    </Button>
  )
}

function RefundButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      {pending && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
      {pending ? 'Processing…' : 'Issue Refund'}
    </Button>
  )
}

export function OrderActions({ orderId, status }: { orderId: string; status: string }) {
  const [showShipForm, setShowShipForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status)

  const boundShip = markShippedAction.bind(null, orderId)
  const [shipState, shipAction] = useActionState<ShipState, FormData>(boundShip, null)

  const boundRefund = refundOrder.bind(null, orderId)
  const [refundState, refundAction] = useActionState<RefundState, FormData>(boundRefund, null)

  if (optimisticStatus === 'cancelled' || optimisticStatus === 'refunded') return null

  const canShip    = optimisticStatus === 'paid'
  const canDeliver = optimisticStatus === 'shipped'
  const canRefund  = ['paid', 'shipped', 'delivered'].includes(optimisticStatus)
  const canCancel  = ['paid', 'created'].includes(optimisticStatus)

  function handleDeliver() {
    startTransition(async () => {
      setOptimisticStatus('delivered')
      await markDelivered(orderId)
    })
  }

  function handleCancel() {
    if (!window.confirm('Cancel this order? Stock will be restored but this cannot be undone.')) return
    startTransition(async () => {
      setOptimisticStatus('cancelled')
      await cancelOrder(orderId)
    })
  }

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
          <Button size="sm" variant="default" disabled={isPending} onClick={handleDeliver}>
            {isPending && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
            {isPending ? 'Saving…' : 'Mark as Delivered'}
          </Button>
        )}

        {canRefund && (
          <form
            action={refundAction}
            onSubmit={(e) => {
              if (!window.confirm('Issue a full refund to the customer? This cannot be undone.')) {
                e.preventDefault()
              }
            }}
          >
            <RefundButton />
          </form>
        )}

        {canCancel && (
          <Button size="sm" variant="outline" disabled={isPending} onClick={handleCancel}>
            {isPending && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
            {isPending ? 'Working…' : 'Cancel Order'}
          </Button>
        )}
      </div>

      {/* Refund result messages */}
      {refundState && 'error' in refundState && (
        <div className="rounded border border-destructive/40 bg-destructive/5 p-4 space-y-1">
          <p className="text-sm font-medium text-destructive">Refund could not be processed automatically</p>
          <p className="text-sm text-muted-foreground">{refundState.error}</p>
        </div>
      )}
      {refundState && 'success' in refundState && (
        <p className="text-sm text-green-700">Refund issued successfully via Razorpay.</p>
      )}

      {/* Inline ship form */}
      {showShipForm && optimisticStatus === 'paid' && (
        <form action={shipAction} className="space-y-3 pt-2 border-t">
          <div className="space-y-1.5">
            <Label htmlFor="tracking">Tracking number</Label>
            <Input id="tracking" name="tracking" placeholder="DTDC1234567890" autoFocus required />
          </div>
          {shipState && 'error' in shipState && (
            <p className="text-sm text-destructive">{shipState.error}</p>
          )}
          <div className="flex gap-2">
            <ShipSubmitButton />
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowShipForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
