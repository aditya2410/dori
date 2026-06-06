'use client'

import { useRef, useState } from 'react'
import { Video, X, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VideoUploaderProps {
  existingUrl?: string | null
  onChange: (url: string | null) => void
}

export function VideoUploader({ existingUrl, onChange }: VideoUploaderProps) {
  const [url, setUrl] = useState<string | null>(existingUrl ?? null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploading = progress !== null

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    const ext = file.name.split('.').pop() ?? 'mp4'

    // Step 1 — get signed URL from server
    let signedUrl = ''
    let publicUrl = ''
    try {
      const res = await fetch('/api/upload/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ext, contentType: file.type }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to prepare upload.'); return }
      signedUrl = json.signedUrl
      publicUrl = json.publicUrl
    } catch {
      setError('Network error. Please try again.')
      return
    }

    // Step 2 — PUT directly to Supabase with progress tracking
    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100))
      }

      xhr.open('PUT', signedUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUrl(publicUrl)
          onChange(publicUrl)
        } else {
          setError('Upload failed. Please try again.')
        }
        setProgress(null)
        resolve()
      }
      xhr.onerror = () => { setError('Network error.'); setProgress(null); resolve() }

      setProgress(0)
      xhr.send(file)
    })

    if (inputRef.current) inputRef.current.value = ''
  }

  function removeVideo() {
    setUrl(null)
    onChange(null)
  }

  return (
    <div className="space-y-3">
      {url && (
        <div className="relative border bg-secondary overflow-hidden">
          <video
            src={url}
            controls
            playsInline
            className="w-full max-h-48 object-contain bg-black"
          />
          <button
            type="button"
            onClick={removeVideo}
            className="absolute top-2 right-2 bg-background/80 p-1 hover:bg-background transition-colors"
            aria-label="Remove video"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {progress !== null && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Uploading video…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {!url && (
        <div className="space-y-1.5">
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
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
            <Video className="size-3.5" />
            {uploading ? `Uploading… ${progress}%` : 'Upload video'}
          </Button>
          <p className="text-xs text-muted-foreground">MP4, WebM, MOV — max 500 MB</p>
        </div>
      )}

      {url && !uploading && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="size-3.5" />
          Replace video
        </Button>
      )}

      {url && (
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={handleFileChange}
          className="sr-only"
          disabled={uploading}
        />
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
