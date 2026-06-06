'use client'

import { useRef, useState, useTransition } from 'react'
import { GripVertical, Check, Loader2 } from 'lucide-react'
import { updateProductOrder } from '@/app/(admin)/admin/series/actions'

interface Product {
  id: string
  name: string
  images: unknown
}

export function ProductOrderList({ seriesId, initialProducts }: { seriesId: string; initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const dragIndex = useRef<number | null>(null)

  if (products.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No products in this collection yet.</p>
  }

  function handleDragStart(i: number) {
    dragIndex.current = i
  }

  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === i) return
    const reordered = [...products]
    const [moved] = reordered.splice(dragIndex.current, 1)
    reordered.splice(i, 0, moved)
    dragIndex.current = i
    setProducts(reordered)
  }

  function handleDragEnd() {
    dragIndex.current = null
    // Auto-save on drop
    setSaved(false)
    startTransition(async () => {
      await updateProductOrder(seriesId, products.map((p) => p.id))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Drag to reorder — saved automatically on drop</p>
        {isPending && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Saving…
          </span>
        )}
        {saved && !isPending && (
          <span className="flex items-center gap-1 text-xs text-green-700">
            <Check className="size-3" /> Saved
          </span>
        )}
      </div>

      <div className="border divide-y">
        {products.map((product, i) => {
          const images = Array.isArray(product.images) ? (product.images as string[]) : []
          return (
            <div
              key={product.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className="flex items-center gap-3 px-4 py-3 bg-background hover:bg-secondary/30 cursor-grab active:cursor-grabbing transition-colors"
            >
              <GripVertical className="size-4 text-muted-foreground shrink-0" />
              <div className="size-10 shrink-0 bg-secondary overflow-hidden">
                {images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={images[0]} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <span className="text-sm font-medium flex-1">{product.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">#{i + 1}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
