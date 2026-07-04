'use client'

import { useRef, useState, useTransition } from 'react'
import { X, Upload, GripVertical, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  addHomeReel,
  deleteHomeReel,
  reorderHomeReels,
  setReelActive,
  setReelProduct,
} from './actions'

interface Reel {
  id: string
  video_url: string
  product_id: string | null
  caption: string | null
  display_order: number
  is_active: boolean
}

interface ProductOption {
  id: string
  name: string
}

export function ReelsManager({
  reels: initial,
  products,
}: {
  reels: Reel[]
  products: ProductOption[]
}) {
  const [reels, setReels] = useState<Reel[]>(initial)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const dragIndex = useRef<number | null>(null)

  // ── Upload ────────────────────────────────────────────────
  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)

    for (const file of files) {
      const ext = file.name.split('.').pop() ?? 'mp4'
      const signRes = await fetch('/api/upload/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ext, contentType: file.type }),
      })
      const { signedUrl, publicUrl } = await signRes.json()

      await new Promise<void>((resolve) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100))
        }
        xhr.open('PUT', signedUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.onload = async () => {
          if (xhr.status < 300) await addHomeReel(publicUrl)
          resolve()
        }
        xhr.onerror = () => resolve()
        setProgress(0)
        xhr.send(file)
      })
    }

    setUploading(false)
    setProgress(0)
    if (inputRef.current) inputRef.current.value = ''
    window.location.reload()
  }

  // ── Delete ────────────────────────────────────────────────
  function handleDelete(id: string) {
    if (!window.confirm('Remove this reel from the home page?')) return
    setReels((prev) => prev.filter((r) => r.id !== id))
    startTransition(() => deleteHomeReel(id))
  }

  // ── Link a product ────────────────────────────────────────
  function handleProduct(id: string, productId: string) {
    const value = productId || null
    setReels((prev) => prev.map((r) => (r.id === id ? { ...r, product_id: value } : r)))
    startTransition(() => setReelProduct(id, value))
  }

  // ── Toggle active ─────────────────────────────────────────
  function handleActive(id: string, isActive: boolean) {
    setReels((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: isActive } : r)))
    startTransition(() => setReelActive(id, isActive))
  }

  // ── Drag reorder ──────────────────────────────────────────
  function handleDragStart(i: number) {
    dragIndex.current = i
  }

  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === i) return
    const reordered = [...reels]
    const [moved] = reordered.splice(dragIndex.current, 1)
    reordered.splice(i, 0, moved)
    dragIndex.current = i
    setReels(reordered)
  }

  function handleDragEnd() {
    dragIndex.current = null
    setSaved(false)
    startTransition(async () => {
      await reorderHomeReels(reels.map((r) => r.id))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Upload */}
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          multiple
          className="sr-only"
          onChange={handleFiles}
          disabled={uploading}
        />
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Upload className="size-3.5" />
          {uploading ? `Uploading… ${progress}%` : 'Add reels'}
        </Button>
        {uploading && (
          <div className="h-1.5 w-48 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-foreground transition-all duration-150" style={{ width: `${progress}%` }} />
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          MP4, WebM or MOV — vertical (9:16) reels look best. Link each to a product to make it shoppable.
        </p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 h-5">
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
        {reels.length > 0 && !isPending && !saved && (
          <span className="text-xs text-muted-foreground">Drag to reorder · {reels.length} reels</span>
        )}
      </div>

      {/* Grid */}
      {reels.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center border border-dashed">
          No reels yet. Add some above.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {reels.map((reel, i) => (
            <div
              key={reel.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className={`border p-2 space-y-2 cursor-grab active:cursor-grabbing ${
                reel.is_active ? '' : 'opacity-50'
              }`}
            >
              <div className="relative aspect-[9/16] bg-secondary overflow-hidden">
                <video
                  src={reel.video_url}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                  onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                  onMouseLeave={(e) => e.currentTarget.pause()}
                />
                <div className="absolute top-1 left-1 text-white/70 pointer-events-none">
                  <GripVertical className="size-4" />
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(reel.id)}
                  className="absolute top-1 right-1 bg-background/80 p-0.5 hover:bg-background transition-colors"
                  aria-label="Delete reel"
                >
                  <X className="size-3.5" />
                </button>
                <div className="absolute bottom-1 right-1 bg-background/70 text-xs px-1 rounded">
                  #{i + 1}
                </div>
              </div>

              {/* Product link */}
              <select
                value={reel.product_id ?? ''}
                onChange={(e) => handleProduct(reel.id, e.target.value)}
                className="w-full border bg-background px-2 py-1.5 text-xs focus:outline-none focus:border-foreground"
              >
                <option value="">No product (Watch only)</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Active toggle */}
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={reel.is_active}
                  onChange={(e) => handleActive(reel.id, e.target.checked)}
                  className="h-3.5 w-3.5 accent-foreground"
                />
                {reel.is_active ? 'Shown on home' : 'Hidden'}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
