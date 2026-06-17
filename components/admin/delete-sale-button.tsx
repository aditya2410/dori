'use client'

import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { deleteSale } from '@/app/(admin)/admin/sales/actions'
import { Button } from '@/components/ui/button'

export function DeleteSaleButton({ saleId, code }: { saleId: string; code: string }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!window.confirm(`Delete code "${code}"? This cannot be undone.`)) return
    startTransition(async () => {
      await deleteSale(saleId)
    })
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-destructive"
      disabled={isPending}
      onClick={handleClick}
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : 'Delete'}
    </Button>
  )
}
