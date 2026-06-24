/**
 * Capability-based gate for the /experience 3D scene.
 *
 * We do NOT gate on "can the browser create a WebGL context" alone — a budget
 * Android can initialise WebGL and then run it at 15-20fps. We route those to
 * the static 2D fallback BY CHOICE. This runs once on the client before the
 * canvas is ever imported/mounted.
 *
 * THRESHOLDS (tunable — change here, they're intentionally in one place):
 *   - prefers-reduced-motion: reduce        → fallback (accessibility, non-negotiable)
 *   - no WebGL/WebGL2 context               → fallback
 *   - software renderer (SwiftShader/llvmpipe/ANGLE software) → fallback
 *   - navigator.deviceMemory present & < 4  → fallback  (catches ≤2GB; 3GB reports 4)
 *   - hardwareConcurrency present & < 4      → fallback  (≤3 logical cores)
 * Anything that survives all checks renders the canvas with DPR capped at 2.
 *
 * Note on deviceMemory: the API rounds to {0.25,0.5,1,2,4,8}, so a true 3GB
 * phone reports 4 and passes. We can't reliably exclude 3GB via deviceMemory;
 * the software-renderer + core checks catch the worst offenders. If field data
 * shows 3GB devices struggling, raise MIN_DEVICE_MEMORY to 8 (excludes most
 * mid-range too) or add a runtime fps probe in Phase 3.
 */
export const MIN_DEVICE_MEMORY = 4 // GB (navigator.deviceMemory units)
export const MIN_CORES = 4 // logical cores
export const MAX_DPR = 2 // cap devicePixelRatio when the canvas mounts

export type TierResult = {
  canRender3D: boolean
  /** Machine-readable reason, surfaced in dev + analytics. */
  reason:
    | 'ok'
    | 'reduced-motion'
    | 'no-webgl'
    | 'software-renderer'
    | 'low-memory'
    | 'low-cores'
    | 'ssr'
}

function probeWebGL(): { ok: boolean; renderer: string | null } {
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl2') ||
      canvas.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return { ok: false, renderer: null }
    let renderer: string | null = null
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    if (ext) renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string
    // Best-effort context teardown so the probe doesn't leak a GL context.
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return { ok: true, renderer }
  } catch {
    return { ok: false, renderer: null }
  }
}

export function detectTier(): TierResult {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { canRender3D: false, reason: 'ssr' }
  }

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return { canRender3D: false, reason: 'reduced-motion' }
  }

  const { ok, renderer } = probeWebGL()
  if (!ok) return { canRender3D: false, reason: 'no-webgl' }
  if (renderer && /swiftshader|llvmpipe|software|microsoft basic/i.test(renderer)) {
    return { canRender3D: false, reason: 'software-renderer' }
  }

  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  if (typeof mem === 'number' && mem < MIN_DEVICE_MEMORY) {
    return { canRender3D: false, reason: 'low-memory' }
  }

  const cores = navigator.hardwareConcurrency
  if (typeof cores === 'number' && cores < MIN_CORES) {
    return { canRender3D: false, reason: 'low-cores' }
  }

  return { canRender3D: true, reason: 'ok' }
}

/** DPR to hand to <Canvas dpr={...}>. Lower bound 1 avoids fuzzy text on hidpi. */
export function cappedDpr(): [number, number] {
  if (typeof window === 'undefined') return [1, 1]
  return [1, Math.min(window.devicePixelRatio || 1, MAX_DPR)]
}
