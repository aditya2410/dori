/**
 * Pre-generate WebP texture variants for the /experience 3D scene.
 *
 * WHY THIS EXISTS (read before changing):
 *  - 3D textures must NOT pass through Next/Image or the Vercel image optimizer
 *    (we're near the monthly cache-write cap) and Supabase image transforms are
 *    unavailable on our free tier. So we bake resized WebP variants ONCE, here,
 *    using local ImageMagick, and upload them to a separate public bucket.
 *  - Originals in `product-images` can be up to ~5700px / >2 MB. A 5712×4284
 *    texture is ~98 MB uncompressed in VRAM — unusable on mobile. Variants are
 *    capped at 1024px max edge (≈ a few MB VRAM, small download).
 *
 * NOT wired into the live admin upload flow — uploads go browser→Supabase
 * directly and Vercel's runtime has no ImageMagick. Run this locally after
 * adding/expiring products. See README note / the Phase 1 report for the
 * proposed live-upload path (client-side canvas resize).
 *
 * Usage:  npx tsx scripts/generate-textures.ts          (all active products)
 *         npx tsx scripts/generate-textures.ts --force   (re-generate existing)
 *
 * Requires: `magick` on PATH and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { spawn } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const SOURCE_BUCKET = 'product-images'
const TEXTURE_BUCKET = 'product-textures'
const MAX_EDGE = 1024 // px, longest side
const QUALITY = 80
const force = process.argv.includes('--force')

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

/** Original `…/product-images/<file>.<ext>` → texture object key `<file>.webp`. */
function textureKey(originalUrl: string): string | null {
  const m = originalUrl.match(/\/product-images\/([^/?#]+)$/)
  if (!m) return null
  return m[1].replace(/\.[^.]+$/, '') + '.webp'
}

/** Resize+strip+orient an image buffer to a WebP buffer via ImageMagick. */
function toWebp(input: Buffer): Promise<Buffer> {
  // `>` only shrinks (never upscales). -auto-orient bakes EXIF rotation,
  // -strip drops metadata. Read stdin, write stdout. (Async execFile has no
  // stdin `input` option, so we spawn and pipe the buffer ourselves.)
  return new Promise((resolvePromise, reject) => {
    const child = spawn(
      'magick',
      ['-', '-auto-orient', '-strip', '-resize', `${MAX_EDGE}x${MAX_EDGE}>`, '-quality', String(QUALITY), 'webp:-'],
    )
    const chunks: Buffer[] = []
    const errChunks: Buffer[] = []
    child.stdout.on('data', (c) => chunks.push(c))
    child.stderr.on('data', (c) => errChunks.push(c))
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolvePromise(Buffer.concat(chunks))
      else reject(new Error(`magick exited ${code}: ${Buffer.concat(errChunks).toString().trim()}`))
    })
    child.stdin.write(input)
    child.stdin.end()
  })
}

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (buckets?.some((b) => b.name === TEXTURE_BUCKET)) return
  const { error } = await supabase.storage.createBucket(TEXTURE_BUCKET, {
    public: true,
    fileSizeLimit: '5MB',
    allowedMimeTypes: ['image/webp'],
  })
  if (error) throw error
  console.log(`Created public bucket "${TEXTURE_BUCKET}"`)
}

async function alreadyExists(key: string): Promise<boolean> {
  // list with a search filter; cheaper than downloading.
  const { data } = await supabase.storage.from(TEXTURE_BUCKET).list('', { search: key, limit: 1 })
  return Boolean(data?.some((f) => f.name === key))
}

async function main() {
  await ensureBucket()

  const { data: products, error } = await supabase
    .from('products')
    .select('slug, images')
    .eq('is_active', true)
  if (error) throw error

  // Unique original URLs that live in our source bucket.
  const urls = new Set<string>()
  for (const p of products ?? []) {
    for (const u of (p.images as string[] | null) ?? []) {
      if (typeof u === 'string' && u.includes(`/${SOURCE_BUCKET}/`)) urls.add(u)
    }
  }

  console.log(`${products?.length ?? 0} active products · ${urls.size} source images\n`)

  let made = 0
  let skipped = 0
  let failed = 0
  let bytesOut = 0

  for (const url of urls) {
    const key = textureKey(url)
    if (!key) { console.warn(`  skip (unparseable): ${url}`); skipped++; continue }

    if (!force && (await alreadyExists(key))) { skipped++; continue }

    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`download ${res.status}`)
      const input = Buffer.from(await res.arrayBuffer())
      const webp = await toWebp(input)

      const { error: upErr } = await supabase.storage
        .from(TEXTURE_BUCKET)
        .upload(key, webp, { contentType: 'image/webp', upsert: true })
      if (upErr) throw upErr

      bytesOut += webp.length
      made++
      console.log(`  ✓ ${key}  ${(input.length / 1024).toFixed(0)}KB → ${(webp.length / 1024).toFixed(0)}KB`)
    } catch (e) {
      failed++
      console.error(`  ✗ ${key}: ${(e as Error).message}`)
    }
  }

  console.log(
    `\nDone. made=${made} skipped=${skipped} failed=${failed} · ` +
      `${(bytesOut / 1024 / 1024).toFixed(1)}MB of variants written`,
  )
  if (failed) process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
