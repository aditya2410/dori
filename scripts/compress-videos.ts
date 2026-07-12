// Phase 2 — re-encode the referenced product videos to web-optimised H.264 MP4.
//
// Why: the source files are raw phone exports — some 4K, three of them HEVC/H.265
// which Chrome & Firefox refuse to play in MP4, and up to 34 MB each. This
// downscales to <=1280px, transcodes to H.264 (universally playable), strips
// audio (reels autoplay muted), and re-uploads IN PLACE at the same object path
// with Content-Type: video/mp4 + a 1-year cache header. URLs are unchanged, so
// no product/reel/series rows need editing and no orphans are created.
//
// Idempotent: an object already at <=1280px / H.264 / no-audio is left alone, so
// re-runs never double-encode (which would degrade quality).
//
//   npx tsx scripts/compress-videos.ts            # report only
//   npx tsx scripts/compress-videos.ts --apply    # encode + re-upload in place
//
// Requires ffmpeg/ffprobe on PATH. On Node 18 run with NODE_EXTRA_CA_CERTS set
// to an exported macOS keychain PEM (see fix-storage-cache.ts notes).

import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import * as dotenv from 'dotenv'
import { execFileSync } from 'child_process'
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { resolve, dirname, join } from 'path'
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
const BUCKET = 'product-videos'
const CACHE_SECONDS = '31536000'
const MAX_DIM = 1280
const CRF = '24'

const supabase = createClient(supabaseUrl, serviceRoleKey)
const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`

// Every video URL referenced by a live row (so we skip anything orphaned).
async function referencedVideoNames(): Promise<Set<string>> {
  const urls: string[] = []
  const push = (v: unknown) => { if (typeof v === 'string' && v) urls.push(v) }
  const p = await supabase.from('products').select('video_url'); if (p.error) throw p.error
  p.data.forEach((r) => push(r.video_url))
  const h = await supabase.from('home_reels').select('video_url'); if (h.error) throw h.error
  h.data.forEach((r) => push(r.video_url))
  const s = await supabase.from('series').select('video_url'); if (s.error) throw s.error
  s.data.forEach((r) => push(r.video_url))
  return new Set(urls.map((u) => u.split('/').pop()!).filter(Boolean))
}

async function listVideos(): Promise<{ name: string; size: number }[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list('', { limit: 1000 })
  if (error) throw error
  return data.filter((f) => f.id).map((f) => ({ name: f.name, size: f.metadata?.size ?? 0 }))
}

type Probe = { codec: string; width: number; height: number; hasAudio: boolean }
function probe(file: string): Probe {
  const v = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=codec_name,width,height', '-of', 'csv=p=0', file]).toString().trim().split(',')
  const a = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries',
    'stream=codec_name', '-of', 'csv=p=0', file]).toString().trim()
  return { codec: v[0], width: Number(v[1]), height: Number(v[2]), hasAudio: a.length > 0 }
}

// Already web-optimised → don't re-encode (avoids generational quality loss).
const alreadyOptimised = (p: Probe) =>
  p.codec === 'h264' && p.width <= MAX_DIM && p.height <= MAX_DIM && !p.hasAudio

async function log(action: string, detail: Record<string, unknown>) {
  if (!APPLY) return
  const { error } = await supabase.from('ops_log').insert({ action, detail })
  if (error) console.warn(`  ! ops_log insert failed: ${error.message}`)
}

async function main() {
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}  (CRF ${CRF}, max ${MAX_DIM}px, no audio)\n`)
  const referenced = await referencedVideoNames()
  const objs = await listVideos()
  const tmp = mkdtempSync(join(tmpdir(), 'dori-vid-'))
  let done = 0, before = 0, after = 0

  try {
    for (const o of objs) {
      if (!referenced.has(o.name)) { console.log(`  skip ${o.name} — not referenced`); continue }

      const src = join(tmp, 'src-' + o.name)
      const dl = await supabase.storage.from(BUCKET).download(o.name)
      if (dl.error || !dl.data) { console.warn(`  ! download failed ${o.name}: ${dl.error?.message}`); continue }
      writeFileSync(src, Buffer.from(await dl.data.arrayBuffer()))

      const p = probe(src)
      if (alreadyOptimised(p)) {
        console.log(`  skip ${o.name} — already H.264 <=${MAX_DIM}px, no audio (${mb(o.size)})`)
        continue
      }

      const dst = join(tmp, 'out.mp4')
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src,
        '-vf', `scale='min(${MAX_DIM},iw)':'min(${MAX_DIM},ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2`,
        '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
        '-crf', CRF, '-preset', 'slow', '-movflags', '+faststart', '-an', dst])
      const outBytes = readFileSync(dst)
      before += o.size; after += outBytes.length; done++

      console.log(`  ${APPLY ? 'ENCODE+UPLOAD' : 'would encode'} ${o.name}: ` +
        `${p.codec} ${p.width}x${p.height} ${mb(o.size)} → h264 ${mb(outBytes.length)}`)

      if (APPLY) {
        const up = await supabase.storage.from(BUCKET).update(o.name, outBytes, {
          contentType: 'video/mp4', cacheControl: CACHE_SECONDS, upsert: true,
        })
        if (up.error) { console.warn(`    ! upload failed: ${up.error.message}`); continue }
        await log('video_recompressed', {
          name: o.name, from: { codec: p.codec, w: p.width, h: p.height, size: o.size },
          to: { codec: 'h264', size: outBytes.length }, contentType: 'video/mp4', cacheControl: `max-age=${CACHE_SECONDS}`,
        })
      }
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }

  console.log(`\n${APPLY ? 'Re-encoded' : 'Would re-encode'} ${done} video(s): ${mb(before)} → ${mb(after)} ` +
    `(saved ${mb(before - after)}).`)
  if (APPLY) await log('video_recompress_run', { count: done, beforeBytes: before, afterBytes: after })
  if (!APPLY) console.log('\nRe-run with --apply to execute.')
}

main().catch((e) => { console.error(e); process.exit(1) })
