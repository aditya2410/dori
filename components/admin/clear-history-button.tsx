'use client'

import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { settleAllOrders } from '@/app/(admin)/admin/orders/actions'
import { Button } from '@/components/ui/button'

export function ClearHistoryButton({ count }: { count: number }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (
      !window.confirm(
        `Mark ${count} completed order${count === 1 ? '' : 's'} as cleared? They will be hidden from this view.`,
      )
    )
      return
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
