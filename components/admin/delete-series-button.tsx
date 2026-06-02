'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteSeries } from '@/app/(admin)/admin/series/actions'

export function DeleteSeriesButton({ seriesId, seriesName }: { seriesId: string; seriesName: string }) {
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (!window.confirm(`Delete "${seriesName}"? This cannot be undone.`)) return
    const result = await deleteSeries(seriesId)
    if (result.error) setError(result.error)
  }

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
        Delete
      </Button>
      {error && <p className="text-xs text-destructive mt-1 max-w-[200px]">{error}</p>}
    </div>
  )
}
