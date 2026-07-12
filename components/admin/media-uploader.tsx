'use client'

import { useRef, useState } from 'react'
import { X, Upload, GripVertical, Video, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { compressImage } from '@/lib/compress-image'

export type MediaItem = { type: 'image' | 'video'; url: string }

interface MediaUploaderProps {
  existing: MediaItem[]
  onChange: (items: MediaItem[]) => void
}

interface UploadState {
  kind: 'image' | 'video'
  totalFiles: number
  currentIndex: number // 1-based
  progress: number     // 0–100 for current file
}

export function MediaUploader({ existing, onChange }: MediaUploaderProps) {
  const [items, setItems] = useState<MediaItem[]>(existing)
  const [uploadState, setUploadState] = useState<UploadState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const dragIndex = useRef<number | null>(null)

  const uploading = uploadState !== null
  const hasVideo = items.some((it) => it.type === 'video')

  function commit(next: MediaItem[]) {
    setItems(next)
    onChange(next)
  }

  // Upload a single file via signed URL → direct PUT to Supabase.
  async function uploadOne(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop() ?? 'bin'
    let signedUrl = ''
    let publicUrl = ''
    try {
      const res = await fetch('/api/upload/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ext, contentType: file.type }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to prepare upload.'); return null }
      signedUrl = json.signedUrl
      publicUrl = json.publicUrl
    } catch {
      setError('Network error. Please try again.')
      return null
    }

    return new Promise<string | null>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          setUploadState((s) => (s ? { ...s, progress: Math.round((ev.loaded / ev.total) * 100) } : s))
        }
      }
      xhr.open('PUT', signedUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      // Cache for a year — without this the object lands as `no-cache`, forcing the
      // CDN/browser to re-fetch on every view (Supabase egress).
      xhr.setRequestHeader('cache-control', 'max-age=31536000')
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(publicUrl)
        else { setError('Upload failed. Please try again.'); resolve(null) }
      }
      xhr.onerror = () => { setError('Network error. Please try again.'); resolve(null) }
      xhr.send(file)
    })
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setError(null)

    const added: MediaItem[] = []
    for (let i = 0; i < files.length; i++) {
      setUploadState({ kind: 'image', totalFiles: files.length, currentIndex: i + 1, progress: 0 })
      // Compress to WebP client-side before the direct upload (photos only; the
      // video path calls uploadOne separately and is left untouched).
      const url = await uploadOne(await compressImage(files[i]))
      if (url) added.push({ type: 'image', url })
    }

    setUploadState(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
    if (!added.length) return

    // Insert new photos before the video (if any) so it stays after the photos.
    const videoIdx = items.findIndex((it) => it.type === 'video')
    commit(
      videoIdx === -1
        ? [...items, ...added]
        : [...items.slice(0, videoIdx), ...added, ...items.slice(videoIdx)],
    )
  }

  async function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    setUploadState({ kind: 'video', totalFiles: 1, currentIndex: 1, progress: 0 })
    const url = await uploadOne(file)
    setUploadState(null)
    if (videoInputRef.current) videoInputRef.current.value = ''
    if (!url) return

    // One video per product — replace any existing one, keep it at the end.
    const withoutVideo = items.filter((it) => it.type !== 'video')
    commit([...withoutVideo, { type: 'video', url }])
  }

  function removeItem(url: string) {
    commit(items.filter((it) => it.url !== url))
  }

  function handleDragStart(index: number) { dragIndex.current = index }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === index) return
    const reordered = [...items]
    const [moved] = reordered.splice(dragIndex.current, 1)
    reordered.splice(index, 0, moved)
    dragIndex.current = index
    commit(reordered)
  }

  function handleDragEnd() { dragIndex.current = null }

  return (
    <div className="space-y-3">
      {(items.length > 0 || uploadState) && (
        <div className="flex flex-wrap gap-3">
          {items.map((item, i) => (
            <div
              key={item.url}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className="relative size-24 border bg-secondary overflow-hidden shrink-0 cursor-grab active:cursor-grabbing"
            >
              {item.type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt={`Media ${i + 1}`} draggable={false} className="h-full w-full object-cover" />
              ) : (
                <>
                  <video src={item.url} muted playsInline preload="metadata" draggable={false} className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                    <Play className="size-5 text-white fill-white" />
                  </span>
                </>
              )}
              <div className="absolute top-1 left-1 text-background/80 pointer-events-none">
                <GripVertical className="size-3" />
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.url)}
                className="absolute top-1 right-1 bg-background/80 p-0.5 hover:bg-background transition-colors"
                aria-label="Remove"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}

          {/* Uploading placeholder card */}
          {uploadState && (
            <div className="relative size-24 border bg-secondary overflow-hidden shrink-0 flex flex-col items-center justify-center gap-1.5 px-2">
              <span className="text-[10px] text-muted-foreground text-center leading-tight">
                {uploadState.kind === 'video'
                  ? 'Uploading video…'
                  : uploadState.totalFiles > 1
                    ? `Photo ${uploadState.currentIndex} of ${uploadState.totalFiles}`
                    : 'Uploading…'}
              </span>
              <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-foreground transition-all duration-150" style={{ width: `${uploadState.progress}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground">{uploadState.progress}%</span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageChange} className="sr-only" disabled={uploading} />
        <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} disabled={uploading}>
          <Upload className="size-3.5" />
          Add images
        </Button>

        <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoChange} className="sr-only" disabled={uploading} />
        <Button type="button" variant="outline" size="sm" onClick={() => videoInputRef.current?.click()} disabled={uploading}>
          <Video className="size-3.5" />
          {hasVideo ? 'Replace video' : 'Add video'}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Images: JPEG, PNG, WebP — max 20 MB each · Video: MP4, WebM, MOV — max 500 MB (run{' '}
        <code>scripts/compress-videos.ts</code> after saving) · Drag to reorder
      </p>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
