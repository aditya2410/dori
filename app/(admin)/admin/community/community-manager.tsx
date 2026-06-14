'use client'

import { useRef, useState, useTransition } from 'react'
import { X, Upload, GripVertical, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addCommunityPhoto, deleteCommunityPhoto, reorderCommunityPhotos } from './actions'

interface Photo { id: string; url: string; display_order: number }

export function CommunityManager({ photos: initial }: { photos: Photo[] }) {
  const [photos, setPhotos]     = useState<Photo[]>(initial)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]  = useState(0)
  const [saved, setSaved]        = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef  = useRef<HTMLInputElement>(null)
  const dragIndex = useRef<number | null>(null)

  // ── Upload ────────────────────────────────────────────────
  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)

    for (const file of files) {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const signRes = await fetch('/api/upload/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ext, contentType: file.type }),
      })
      const { signedUrl, publicUrl } = await signRes.json()

      await new Promise<void>((resolve) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round(ev.loaded / ev.total * 100))
        }
        xhr.open('PUT', signedUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.onload = async () => {
          if (xhr.status < 300) await addCommunityPhoto(publicUrl)
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
    // Reload photos from server
    window.location.reload()
  }

  // ── Delete ────────────────────────────────────────────────
  function handleDelete(id: string) {
    if (!window.confirm('Remove this photo from the banner?')) return
    setPhotos((prev) => prev.filter((p) => p.id !== id))
    startTransition(() => deleteCommunityPhoto(id))
  }

  // ── Drag reorder ──────────────────────────────────────────
  function handleDragStart(i: number) { dragIndex.current = i }

  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === i) return
    const reordered = [...photos]
    const [moved] = reordered.splice(dragIndex.current, 1)
    reordered.splice(i, 0, moved)
    dragIndex.current = i
    setPhotos(reordered)
  }

  function handleDragEnd() {
    dragIndex.current = null
    setSaved(false)
    startTransition(async () => {
      await reorderCommunityPhotos(photos.map((p) => p.id))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Upload */}
      <div className="space-y-2">
        <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleFiles} disabled={uploading} />
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Upload className="size-3.5" />
          {uploading ? `Uploading… ${progress}%` : 'Add photos'}
        </Button>
        {uploading && (
          <div className="h-1.5 w-48 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-foreground transition-all duration-150" style={{ width: `${progress}%` }} />
          </div>
        )}
        <p className="text-xs text-muted-foreground">JPEG, PNG, WebP — square or portrait photos work best</p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 h-5">
        {isPending && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" /> Saving…</span>}
        {saved && !isPending && <span className="flex items-center gap-1 text-xs text-green-700"><Check className="size-3" /> Saved</span>}
        {photos.length > 0 && !isPending && !saved && (
          <span className="text-xs text-muted-foreground">Drag to reorder · {photos.length} photos</span>
        )}
      </div>

      {/* Grid */}
      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center border border-dashed">No photos yet. Add some above.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className="relative aspect-square bg-secondary overflow-hidden cursor-grab active:cursor-grabbing group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
              <div className="absolute top-1 left-1 text-white/70 pointer-events-none">
                <GripVertical className="size-4" />
              </div>
              <button
                type="button"
                onClick={() => handleDelete(photo.id)}
                className="absolute top-1 right-1 bg-background/80 p-0.5 hover:bg-background transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>
              <div className="absolute bottom-1 right-1 bg-background/70 text-xs px-1 rounded">#{i + 1}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
