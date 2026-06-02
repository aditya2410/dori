'use client'

import { useRef, useState } from 'react'
import { X, Upload, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageUploaderProps {
  existingImages: string[]
  onChange: (urls: string[]) => void
}

export function ImageUploader({ existingImages, onChange }: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(existingImages)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragIndex = useRef<number | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    setUploading(true)
    setError(null)

    const newUrls: string[] = []

    for (const file of files) {
      const body = new FormData()
      body.append('file', file)

      const res = await fetch('/api/upload', { method: 'POST', body })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Upload failed.')
        continue
      }

      newUrls.push(json.url as string)
    }

    const updated = [...images, ...newUrls]
    setImages(updated)
    onChange(updated)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function removeImage(url: string) {
    const updated = images.filter((u) => u !== url)
    setImages(updated)
    onChange(updated)
  }

  function handleDragStart(index: number) {
    dragIndex.current = index
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === index) return
    const reordered = [...images]
    const [moved] = reordered.splice(dragIndex.current, 1)
    reordered.splice(index, 0, moved)
    dragIndex.current = index
    setImages(reordered)
    onChange(reordered)
  }

  function handleDragEnd() {
    dragIndex.current = null
  }

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((url, i) => (
            <div
              key={url}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className="relative size-24 border bg-secondary overflow-hidden shrink-0 cursor-grab active:cursor-grabbing"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Product image ${i + 1}`} className="h-full w-full object-cover" />
              <div className="absolute top-1 left-1 text-background/80 pointer-events-none">
                <GripVertical className="size-3" />
              </div>
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute top-1 right-1 bg-background/80 p-0.5 hover:bg-background transition-colors"
                aria-label="Remove image"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="sr-only"
          disabled={uploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="size-3.5" />
          {uploading ? 'Uploading…' : 'Add images'}
        </Button>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, WebP — max 5 MB each · Drag to reorder
        </p>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
