/**
 * Maps a `product-images` original URL to its pre-baked WebP texture variant
 * in the `product-textures` bucket (see scripts/generate-textures.ts).
 *
 * Variants are 1024px-max-edge WebP, generated offline so 3D textures never
 * touch Next/Image or the Vercel image optimizer. Used only by the /experience
 * scene — the 2D site keeps using originals via Next/Image as before.
 *
 * If the URL isn't a product-images object (e.g. a placehold.co seed image),
 * it's returned unchanged — those are already tiny.
 */
export function textureUrl(originalUrl: string): string {
  const m = originalUrl.match(/^(.*)\/product-images\/([^/?#]+)$/)
  if (!m) return originalUrl
  const [, prefix, file] = m
  const base = file.replace(/\.[^.]+$/, '')
  return `${prefix}/product-textures/${base}.webp`
}
