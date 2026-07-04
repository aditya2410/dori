// Client-side image compression. Runs in the browser before the signed direct
// upload to Supabase, so a 3 MB phone photo becomes a ~200–350 KB WebP that
// Next's image optimizer can fetch and resize without timing out.

const MAX_DIMENSION = 1920 // longest edge; matches the widest deviceSize we serve
const QUALITY = 0.82

// Formats we can't (or shouldn't) re-encode via canvas — pass them through as-is.
const SKIP_TYPES = new Set(['image/gif', 'image/svg+xml'])

/**
 * Downscale + re-encode an image File to WebP. Returns a new File (named
 * `*.webp`, type `image/webp`) so callers that derive ext/contentType from the
 * File keep working. Falls back to the original File on any failure, or when
 * compression wouldn't actually save bytes.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || SKIP_TYPES.has(file.type)) return file

  try {
    const bitmap = await createImageBitmap(file)
    const { width, height } = bitmap

    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height))
    const targetW = Math.round(width * scale)
    const targetH = Math.round(height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return file
    }
    ctx.drawImage(bitmap, 0, 0, targetW, targetH)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', QUALITY),
    )

    // No blob, or re-encoding didn't beat the original (e.g. already-small WebP).
    if (!blob || blob.size >= file.size) return file

    const name = file.name.replace(/\.[^.]+$/, '') + '.webp'
    return new File([blob], name, { type: 'image/webp', lastModified: Date.now() })
  } catch {
    // HEIC or other formats the browser can't decode — upload the original.
    return file
  }
}
