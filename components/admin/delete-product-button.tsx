'use client'

import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { deleteProduct } from '@/app/(admin)/admin/products/actions'
import { Button } from '@/components/ui/button'

export function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!window.confirm(`Delete "${productName}"? This cannot be undone.`)) return
    startTransition(async () => {
      await deleteProduct(productId)
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
