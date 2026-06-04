'use client'

import { useRef, useState } from 'react'
import { X, Upload, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageUploaderProps {
  existingImages: string[]
  onChange: (urls: string[]) => void
}

interface UploadState {
  totalFiles: number
  currentIndex: number   // 1-based
  progress: number       // 0–100 for current file
}

function uploadFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const body = new FormData()
    body.append('file', file)

    xhr.open('POST', '/api/upload')
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const json = JSON.parse(xhr.responseText)
        resolve(json.url as string)
      } else {
        reject(new Error(JSON.parse(xhr.responseText)?.error ?? 'Upload failed.'))
      }
    }
    xhr.onerror = () => reject(new Error('Network error.'))
    xhr.send(body)
  })
}

export function ImageUploader({ existingImages, onChange }: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(existingImages)
  const [uploadState, setUploadState] = useState<UploadState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragIndex = useRef<number | null>(null)

  const uploading = uploadState !== null

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    setError(null)
    const newUrls: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      await new Promise<void>((resolve) => {
        const xhr = new XMLHttpRequest()
        const body = new FormData()
        body.append('file', file)

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setUploadState({
              totalFiles: files.length,
              currentIndex: i + 1,
              progress: Math.round((ev.loaded / ev.total) * 100),
            })
          }
        }

        xhr.open('POST', '/api/upload')
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const json = JSON.parse(xhr.responseText)
            newUrls.push(json.url as string)
            // Briefly show 100% before moving to next file
            setUploadState({ totalFiles: files.length, currentIndex: i + 1, progress: 100 })
          } else {
            try {
              setError(JSON.parse(xhr.responseText)?.error ?? 'Upload failed.')
            } catch {
              setError('Upload failed.')
            }
          }
          resolve()
        }
        xhr.onerror = () => {
          setError('Network error. Please try again.')
          resolve()
        }

        setUploadState({ totalFiles: files.length, currentIndex: i + 1, progress: 0 })
        xhr.send(body)
      })
    }

    setUploadState(null)
    if (inputRef.current) inputRef.current.value = ''

    if (newUrls.length > 0) {
      setImages((prev) => {
        const updated = [...prev, ...newUrls]
        onChange(updated)
        return updated
      })
    }
  }

  function removeImage(url: string) {
    const updated = images.filter((u) => u !== url)
    setImages(updated)
    onChange(updated)
  }

  function handleDragStart(index: number) { dragIndex.current = index }

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

  function handleDragEnd() { dragIndex.current = null }

  return (
    <div className="space-y-3">
      {/* Existing images */}
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

          {/* Uploading placeholder card */}
          {uploadState && (
            <div className="relative size-24 border bg-secondary overflow-hidden shrink-0 flex flex-col items-center justify-center gap-1.5 px-2">
              <span className="text-[10px] text-muted-foreground text-center leading-tight">
                {uploadState.totalFiles > 1
                  ? `Photo ${uploadState.currentIndex} of ${uploadState.totalFiles}`
                  : 'Uploading…'}
              </span>
              <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-foreground transition-all duration-150"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{uploadState.progress}%</span>
            </div>
          )}
        </div>
      )}

      {/* Progress bar when no existing images yet */}
      {uploadState && images.length === 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {uploadState.totalFiles > 1
                ? `Uploading photo ${uploadState.currentIndex} of ${uploadState.totalFiles}…`
                : 'Uploading…'}
            </span>
            <span>{uploadState.progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground transition-all duration-150"
              style={{ width: `${uploadState.progress}%` }}
            />
          </div>
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
          {uploading ? `Uploading ${uploadState!.currentIndex} of ${uploadState!.totalFiles}…` : 'Add images'}
        </Button>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, WebP — max 5 MB each · Drag to reorder
        </p>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
