'use client'

import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { settleAllOrders } from '@/app/(admin)/admin/orders/actions'
import { Button } from '@/components/ui/button'

interface ClearHistoryButtonProps {
  count: number
  unshippedCount: number
  shippedCount: number
}

export function ClearHistoryButton({ count, unshippedCount, shippedCount }: ClearHistoryButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    const warnings: string[] = []
    if (unshippedCount > 0) warnings.push(`${unshippedCount} order${unshippedCount === 1 ? '' : 's'} still need${unshippedCount === 1 ? 's' : ''} to be shipped`)
    if (shippedCount > 0) warnings.push(`${shippedCount} shipped order${shippedCount === 1 ? '' : 's'} still need${shippedCount === 1 ? 's' : ''} to be marked delivered`)

    let message = `Mark ${count} completed order${count === 1 ? '' : 's'} as cleared? They will be hidden from this view.`
    if (warnings.length > 0) {
      message += `\n\n⚠️ Note: ${warnings.join(' and ')}.`
    }

    if (!window.confirm(message)) return
    startTransition(async () => {
      await settleAllOrders()
    })
  }

  return (
    <Button size="sm" variant="outline" disabled={isPending} onClick={handleClick}>
      {isPending && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
      {isPending ? 'Clearing…' : `Clear History (${count})`}
    </Button>
  )
}
