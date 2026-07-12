// Compress product images to WebP to cut Supabase egress on ad-driven traffic.
//
// Product images are the dominant egress line once the videos are compressed and
// the home reels are removed — the campaign landing pages are image-heavy. This
// re-encodes every root object in `product-images` to WebP (<=1600px, quality 80)
// and re-uploads IN PLACE with a 1-year cache header. URLs are unchanged, so no
// product/series/community rows need editing. Browsers render WebP from the
// Content-Type regardless of the .jpg/.jpeg/.png path (the site uses plain <img>).
//
// Lossy + in place — but 1600px/q80 is visually clean and your source files live
// on the uploading device. The `originals/` backup folder is left untouched.
//
// Idempotent: an object already WebP and <=1600px is skipped (no double-encode).
//
//   npx tsx scripts/compress-product-images.ts            # dry run
//   npx tsx scripts/compress-product-images.ts --apply    # re-encode + re-upload
//
// Node 18: run with NODE_EXTRA_CA_CERTS set (see fix-storage-cache.ts notes).

import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import sharp from 'sharp'
import * as dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env.local') })
;(globalThis as unknown as { WebSocket?: unknown }).WebSocket ??= ws

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const APPLY = process.argv.includes('--apply')
const BUCKET = 'product-images'
const CACHE_SECONDS = '31536000'
const MAX_DIM = 1600
const QUALITY = 80

const supabase = createClient(supabaseUrl, serviceRoleKey)
const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`

async function listRoot(): Promise<{ name: string; size: number }[]> {
  const out: { name: string; size: number }[] = []
  const pageSize = 100
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list('', { limit: pageSize, offset, sortBy: { column: 'name', order: 'asc' } })
    if (error) throw error
    if (!data.length) break
    for (const f of data) if (f.id) out.push({ name: f.name, size: f.metadata?.size ?? 0 })
    if (data.length < pageSize) break
  }
  return out
}

async function log(action: string, detail: Record<string, unknown>) {
  if (!APPLY) return
  const { error } = await supabase.from('ops_log').insert({ action, detail })
  if (error) console.warn(`  ! ops_log insert failed: ${error.message}`)
}

async function main() {
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}  (WebP q${QUALITY}, max ${MAX_DIM}px)\n`)
  const files = await listRoot()
  console.log(`Found ${files.length} root objects in ${BUCKET}\n`)
  let done = 0, before = 0, after = 0, skipped = 0

  for (const f of files) {
    const dl = await supabase.storage.from(BUCKET).download(f.name)
    if (dl.error || !dl.data) { console.warn(`  ! download failed ${f.name}: ${dl.error?.message}`); continue }
    const input = Buffer.from(await dl.data.arrayBuffer())

    let meta: sharp.Metadata
    try { meta = await sharp(input).metadata() }
    catch { console.warn(`  skip ${f.name} — not a processable image`); continue }

    // Already WebP and within bounds → leave it (avoids generational loss).
    if (meta.format === 'webp' && (meta.width ?? 0) <= MAX_DIM && (meta.height ?? 0) <= MAX_DIM) {
      skipped++; continue
    }

    let output: Buffer
    try {
      output = await sharp(input)
        .rotate() // bake EXIF orientation before stripping metadata
        .resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer()
    } catch (e) { console.warn(`  skip ${f.name} — ${(e as Error).message}`); continue }

    if (output.length >= input.length) { console.log(`  keep ${f.name} — WebP not smaller (${kb(input.length)})`); skipped++; continue }

    done++; before += input.length; after += output.length
    console.log(`  ${APPLY ? 'WRITE' : 'would write'} ${f.name}: ${meta.format} ${meta.width}x${meta.height} ${kb(input.length)} → webp ${kb(output.length)}`)

    if (APPLY) {
      const up = await supabase.storage.from(BUCKET).update(f.name, output, {
        contentType: 'image/webp', cacheControl: CACHE_SECONDS, upsert: true,
      })
      if (up.error) { console.warn(`    ! upload failed: ${up.error.message}`); continue }
      await log('image_recompressed', { name: f.name, from: { format: meta.format, w: meta.width, h: meta.height, size: input.length }, to: { format: 'webp', size: output.length } })
    }
  }

  console.log(`\n${APPLY ? 'Compressed' : 'Would compress'} ${done} image(s), skipped ${skipped}: ` +
    `${kb(before)} → ${kb(after)} (saved ${kb(before - after)}).`)
  if (APPLY) await log('image_recompress_run', { count: done, beforeBytes: before, afterBytes: after })
  if (!APPLY) console.log('\nRe-run with --apply to execute.')
}

main().catch((e) => { console.error(e); process.exit(1) })
