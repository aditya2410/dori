// One-time cleanup: downscale the oversized originals already sitting in the
// `product-images` bucket so Next's image optimizer stops timing out on them.
//
// Re-encodes in place at the SAME path (as JPEG, preserving the existing
// extension + content-type) so every product URL keeps resolving. Before each
// overwrite the untouched original is copied to `originals/<name>` in the same
// bucket, so nothing is lost. Runs as a DRY RUN by default.
//
//   npx tsx scripts/reprocess-images.ts            # report only
//   npx tsx scripts/reprocess-images.ts --apply    # back up + rewrite in place

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import * as dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const BUCKET = 'product-images'
const BACKUP_PREFIX = 'originals/'
const MAX_DIMENSION = 1920
const QUALITY = 82
const SIZE_THRESHOLD = 500 * 1024 // only touch files larger than 500 KB
const APPLY = process.argv.includes('--apply')

const supabase = createClient(supabaseUrl, serviceRoleKey)

const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`

async function listAll(): Promise<{ name: string; size: number }[]> {
  const out: { name: string; size: number }[] = []
  const pageSize = 100
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list('', { limit: pageSize, offset, sortBy: { column: 'name', order: 'asc' } })
    if (error) throw error
    if (!data.length) break
    for (const f of data) {
      // Skip "folders" (no metadata) — this bucket is flat, but be safe.
      if (f.id) out.push({ name: f.name, size: f.metadata?.size ?? 0 })
    }
    if (data.length < pageSize) break
  }
  return out
}

async function main() {
  console.log(`Mode: ${APPLY ? 'APPLY (overwriting in place)' : 'DRY RUN (no changes)'}\n`)
  const files = await listAll()
  console.log(`Found ${files.length} objects in ${BUCKET}\n`)

  let processed = 0
  let savedBytes = 0

  for (const f of files) {
    if (f.size && f.size < SIZE_THRESHOLD) continue

    const { data, error } = await supabase.storage.from(BUCKET).download(f.name)
    if (error || !data) {
      console.warn(`  skip ${f.name} — download failed: ${error?.message}`)
      continue
    }
    const input = Buffer.from(await data.arrayBuffer())

    let output: Buffer
    try {
      output = await sharp(input)
        .rotate() // respect EXIF orientation before we strip metadata
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toBuffer()
    } catch (e) {
      console.warn(`  skip ${f.name} — not a processable image (${(e as Error).message})`)
      continue
    }

    if (output.length >= input.length) {
      console.log(`  keep ${f.name} — already small (${kb(input.length)})`)
      continue
    }

    processed++
    savedBytes += input.length - output.length
    console.log(`  ${APPLY ? 'wrote' : 'would write'} ${f.name}: ${kb(input.length)} → ${kb(output.length)}`)

    if (APPLY) {
      // Back up the untouched original first. `copy` errors if the destination
      // already exists — treat that as "already backed up" and continue.
      const { error: cpErr } = await supabase.storage
        .from(BUCKET)
        .copy(f.name, BACKUP_PREFIX + f.name)
      if (cpErr && !/exists|duplicate/i.test(cpErr.message)) {
        console.warn(`    ! backup failed for ${f.name}, skipping overwrite: ${cpErr.message}`)
        continue
      }

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .update(f.name, output, { contentType: 'image/jpeg', cacheControl: '3600', upsert: true })
      if (upErr) console.warn(`    ! failed to write ${f.name}: ${upErr.message}`)
    }
  }

  console.log(
    `\n${APPLY ? 'Rewrote' : 'Would rewrite'} ${processed} file(s), saving ${kb(savedBytes)} total.`,
  )
  if (!APPLY && processed > 0) console.log('Re-run with --apply to overwrite in place.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
