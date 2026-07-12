// Phase 1 — Supabase egress fix: correct Cache-Control on static product media
// and delete orphaned uploads that nothing on the site links to.
//
// Root cause: videos + some images were uploaded via createSignedUploadUrl
// (app/api/upload/sign/route.ts), which cannot set cacheControl, so they landed
// as `no-cache` and forced CDN revalidation on nearly every ad-driven view.
//
// This script:
//   1. Builds the set of media URLs actually referenced by live rows
//      (products.images / products.video_url, home_reels.video_url,
//       series.video_url / series.cover_image_url, community_photos.url).
//   2. Deletes orphaned objects (no-cache images + every unreferenced video).
//   3. Re-caches referenced `no-cache` objects to a durable immutable header by
//      downloading + re-uploading in place (supabase-js has no metadata-only
//      cache update — a full re-upload is required).
//
// Idempotent: re-running skips objects already on the immutable header and
// re-derives orphans fresh each run. DRY RUN by default. Every applied change
// is logged to public.ops_log (not console — per the Vercel-Hobby constraint).
//
//   npx tsx scripts/fix-storage-cache.ts            # report only
//   npx tsx scripts/fix-storage-cache.ts --apply    # delete orphans + re-cache
//
// Note: the 5 referenced videos are re-cached here so Phase 1 fully closes, but
// Phase 2 re-encodes and re-uploads them (still immutable). Pass --skip-videos
// to leave them for Phase 2 and avoid the redundant ~74 MB round-trip.

import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import * as dotenv from 'dotenv'

// Node 18 has no native WebSocket; supabase-js eagerly inits its realtime client.
// We don't use realtime, but the client constructor needs a WS constructor present.
;(globalThis as unknown as { WebSocket?: unknown }).WebSocket ??= ws
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

const APPLY = process.argv.includes('--apply')
const SKIP_VIDEOS = process.argv.includes('--skip-videos')
// Orphan deletion is opt-in. Without this flag the script only re-caches
// referenced objects and leaves everything else (orphans, backups) untouched.
const DELETE_ORPHANS = process.argv.includes('--delete-orphans')
// supabase-js formats this as `cache-control: max-age=<value>`, so it must be a
// bare seconds count — a full directive string gets mangled into
// `max-age=public, max-age=..., immutable`. 1 year is plenty to stop revalidation.
const CACHE_SECONDS = '31536000'

const supabase = createClient(supabaseUrl, serviceRoleKey)
const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`

type Obj = { name: string; size: number; cacheControl: string }

async function listAll(bucket: string): Promise<Obj[]> {
  const out: Obj[] = []
  const pageSize = 100
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list('', { limit: pageSize, offset, sortBy: { column: 'name', order: 'asc' } })
    if (error) throw error
    if (!data.length) break
    for (const f of data) {
      if (f.id) {
        out.push({
          name: f.name,
          size: f.metadata?.size ?? 0,
          cacheControl: f.metadata?.cacheControl ?? '',
        })
      }
    }
    if (data.length < pageSize) break
  }
  return out
}

// Every media URL referenced by a live row, lowercased for loose matching.
async function referencedUrls(): Promise<string[]> {
  const urls: string[] = []
  const push = (v: unknown) => { if (typeof v === 'string' && v) urls.push(v) }

  const products = await supabase.from('products').select('images, video_url')
  if (products.error) throw products.error
  for (const p of products.data) {
    push(p.video_url)
    if (Array.isArray(p.images)) p.images.forEach(push)
  }

  const reels = await supabase.from('home_reels').select('video_url')
  if (reels.error) throw reels.error
  reels.data.forEach((r) => push(r.video_url))

  const series = await supabase.from('series').select('video_url, cover_image_url')
  if (series.error) throw series.error
  series.data.forEach((s) => { push(s.video_url); push(s.cover_image_url) })

  const photos = await supabase.from('community_photos').select('url')
  if (photos.error) throw photos.error
  photos.data.forEach((c) => push(c.url))

  return urls
}

async function log(action: string, detail: Record<string, unknown>) {
  if (!APPLY) return
  const { error } = await supabase.from('ops_log').insert({ action, detail })
  if (error) console.warn(`  ! ops_log insert failed: ${error.message}`)
}

async function main() {
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}${SKIP_VIDEOS ? ' (skip videos)' : ''}\n`)

  const refs = await referencedUrls()
  const isReferenced = (name: string) => refs.some((u) => u.includes(name))

  const buckets = SKIP_VIDEOS ? ['product-images'] : ['product-videos', 'product-images']
  let deleted = 0, deletedBytes = 0, recached = 0

  for (const bucket of buckets) {
    const objs = await listAll(bucket)
    console.log(`\n=== ${bucket}: ${objs.length} objects ===`)

    for (const o of objs) {
      // Skip the reprocess-images backup folder; leave cached objects alone.
      if (o.name.startsWith('originals/')) continue

      const referenced = isReferenced(o.name)
      // Bad headers we fix: origin `no-cache`, and the earlier malformed
      // `max-age=public, ...` written before the CACHE_SECONDS fix. Intentional
      // `max-age=3600` images set by reprocess-images.ts are left as-is.
      const needsFix = o.cacheControl === 'no-cache' || o.cacheControl.includes('public')

      // Target set: videos + any object with a bad header.
      const inScope = bucket === 'product-videos' || needsFix
      if (!inScope) continue

      if (!referenced) {
        if (!DELETE_ORPHANS) {
          console.log(`  keep orphan ${o.name} (${mb(o.size)}) — deletion disabled`)
          continue
        }
        console.log(`  ${APPLY ? 'DELETE' : 'would delete'} orphan ${o.name} (${mb(o.size)})`)
        if (APPLY) {
          const { error } = await supabase.storage.from(bucket).remove([o.name])
          if (error) { console.warn(`    ! delete failed: ${error.message}`); continue }
          await log('storage_orphan_deleted', { bucket, name: o.name, size: o.size })
        }
        deleted++; deletedBytes += o.size
        continue
      }

      // Referenced but stale/malformed cache header → re-upload in place.
      if (needsFix) {
        const target = `max-age=${CACHE_SECONDS}`
        console.log(`  ${APPLY ? 'RECACHE' : 'would recache'} ${o.name} (${mb(o.size)}) [${o.cacheControl}] → ${target}`)
        if (APPLY) {
          const dl = await supabase.storage.from(bucket).download(o.name)
          if (dl.error || !dl.data) { console.warn(`    ! download failed: ${dl.error?.message}`); continue }
          const bytes = Buffer.from(await dl.data.arrayBuffer())
          const contentType = dl.data.type || 'application/octet-stream'
          const up = await supabase.storage.from(bucket).update(o.name, bytes, {
            contentType, cacheControl: CACHE_SECONDS, upsert: true,
          })
          if (up.error) { console.warn(`    ! re-upload failed: ${up.error.message}`); continue }
          await log('storage_recached', { bucket, name: o.name, size: o.size, from: o.cacheControl, to: target })
        }
        recached++
      }
    }
  }

  console.log(
    `\n${APPLY ? 'Deleted' : 'Would delete'} ${deleted} orphan(s) (${mb(deletedBytes)}); ` +
    `${APPLY ? 're-cached' : 'would re-cache'} ${recached} referenced object(s).`,
  )
  if (APPLY) await log('storage_cache_fix_run', { deleted, deletedBytes, recached })
  if (!APPLY) console.log('\nRe-run with --apply to execute.')
}

main().catch((e) => { console.error(e); process.exit(1) })
