'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { ContactShadows, RoundedBox } from '@react-three/drei'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'
import { cappedDpr } from '@/lib/device-tier'
import { ShowroomLoading } from './showroom-loading'
import type { ExperienceProduct } from './experience-shell'
import type { ExperienceQuote } from '@/lib/experience-content'

const BG = '#efe8dd' // warm off-white, matches the storefront neutral
const PLANE_HEIGHT = 2.4 // world units
const CARD_ASPECT = 0.78 // every card is the SAME portrait shape; photos are
const CARD_WIDTH = PLANE_HEIGHT * CARD_ASPECT // center-cropped to fill it (cover)
const FRAME_PAD = 0.16 // cream mat border around the photo
const FRAME_DEPTH = 0.12 // physical thickness of each card — the key "not flat" cue

/**
 * CSS `object-fit: cover` for a texture: crop the photo (via UV repeat/offset)
 * so it fills the uniform card frame without distortion, keeping the centre.
 */
function applyCover(tex: THREE.Texture, imgAspect: number, frameAspect: number) {
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
  if (imgAspect > frameAspect) {
    const r = frameAspect / imgAspect
    tex.repeat.set(r, 1)
    tex.offset.set((1 - r) / 2, 0)
  } else {
    const r = imgAspect / frameAspect
    tex.repeat.set(1, r)
    tex.offset.set(0, (1 - r) / 2)
  }
}
const CAMERA_GAP = 5.0 // fallback distance to the front card before the rig fits it
const CAMERA_FOV = 46
const CARD_FIT = 0.62 // front card occupies ~62% of the limiting viewport dimension

/**
 * Ring radius derived from the cards themselves so consecutive cards sit close
 * enough to read as a *curve*, not a row of far-apart photos. `minNoOverlap` is
 * the tightest radius before neighbours touch; the gap factor opens it slightly.
 * Portrait/narrow screens use a tighter gap so the arc is legible on a phone.
 */
function ringRadius(count: number, aspect: number) {
  const minNoOverlap = CARD_WIDTH / (2 * Math.sin(Math.PI / Math.max(count, 2)))
  const gap = aspect < 1 ? 1.14 : 1.4 // tighter on portrait phones
  return Math.max(2.4, minNoOverlap * gap)
}

/**
 * Positions the camera so the front card is framed consistently on ANY aspect
 * ratio — crucially, pulls back on portrait phones (narrow horizontal FOV) so a
 * card never fills the screen. Re-fits on resize/orientation change.
 */
function CameraRig({ radius }: { radius: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)

  useEffect(() => {
    const aspect = width / height
    const halfFov = THREE.MathUtils.degToRad(CAMERA_FOV) / 2
    const distForHeight = PLANE_HEIGHT / CARD_FIT / (2 * Math.tan(halfFov))
    const distForWidth = CARD_WIDTH / CARD_FIT / (2 * Math.tan(halfFov) * aspect)
    const dist = Math.max(distForHeight, distForWidth)
    camera.position.set(0, 0.4, radius + dist)
    camera.updateProjectionMatrix()
  }, [camera, width, height, radius])

  return null
}

type LoadedTexture = { texture: THREE.Texture; aspect: number }
type Pointer = { x: number; y: number }

/**
 * Loads the pre-baked WebP variants as plain GPU textures and — critically —
 * disposes every one on unmount so leaving /experience frees VRAM. Loaded
 * outside the R3F scene graph, so r3f's auto-dispose does NOT cover these;
 * the cleanup below is what prevents the leak.
 */
function useProductTextures(urls: string[]) {
  const [loaded, setLoaded] = useState<(LoadedTexture | null)[]>([])

  useEffect(() => {
    let cancelled = false
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous') // Supabase public bucket serves permissive CORS
    const textures: (THREE.Texture | null)[] = []

    Promise.all(
      urls.map(
        (url) =>
          new Promise<LoadedTexture | null>((resolve) => {
            loader.load(
              url,
              (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace
                texture.anisotropy = 4
                const img = texture.image as { width: number; height: number }
                const aspect = img.width / img.height
                // Crop to the uniform card shape so every card is the same width.
                applyCover(texture, aspect, CARD_ASPECT)
                resolve({ texture, aspect })
              },
              undefined,
              () => resolve(null), // a single 404'd variant shouldn't kill the scene
            )
          }),
      ),
    ).then((results) => {
      if (cancelled) {
        results.forEach((r) => r?.texture.dispose())
        return
      }
      results.forEach((r) => r && textures.push(r.texture))
      setLoaded(results)
    })

    return () => {
      cancelled = true
      textures.forEach((t) => t?.dispose())
    }
  }, [urls])

  return loaded
}

type DragState = { dragging: boolean; lastX: number; vel: number; moved: boolean }

/**
 * A single framed card: a thick cream mat (RoundedBox, lit) with the photo
 * inset on its front face. Thickness + lighting on the frame is what reads as
 * a physical object instead of a flat image. The photo itself stays unlit
 * (meshBasic) for true colour.
 */
function Card({
  product,
  loaded,
  index,
  count,
  radius,
  hovered,
  onHover,
  drag,
}: {
  product: ExperienceProduct
  loaded: LoadedTexture
  index: number
  count: number
  radius: number
  hovered: boolean
  onHover: (i: number | null) => void
  drag: React.MutableRefObject<DragState>
}) {
  const inner = useRef<THREE.Group>(null)
  const router = useRouter()

  const angle = (index / count) * Math.PI * 2
  const x = Math.sin(angle) * radius
  const z = Math.cos(angle) * radius
  const width = CARD_WIDTH // uniform across all cards

  useFrame((state) => {
    const g = inner.current
    if (!g) return
    // Gentle, per-card floating bob (de-synced by index) — subtle life.
    g.position.y = Math.sin(state.clock.elapsedTime * 0.6 + index) * 0.06
    // Smoothly ease toward hover scale + a slight pop toward the viewer.
    const targetScale = hovered ? 1.05 : 1
    const s = THREE.MathUtils.lerp(g.scale.x, targetScale, 0.12)
    g.scale.setScalar(s)
    g.position.z = THREE.MathUtils.lerp(g.position.z, hovered ? 0.2 : 0, 0.12)
  })

  return (
    <group position={[x, 0, z]} rotation={[0, angle, 0]}>
      <group
        ref={inner}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          onHover(index)
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          if (drag.current.moved) return // a drag, not a tap
          router.push(`/products/${product.slug}`)
        }}
      >
        <RoundedBox
          args={[width + FRAME_PAD, PLANE_HEIGHT + FRAME_PAD, FRAME_DEPTH]}
          radius={0.05}
          smoothness={3}
          castShadow
        >
          <meshStandardMaterial color="#f4ecdd" roughness={0.65} metalness={0.04} />
        </RoundedBox>
        {/* Photo on the front face… */}
        <mesh position={[0, 0, FRAME_DEPTH / 2 + 0.006]}>
          <planeGeometry args={[width, PLANE_HEIGHT]} />
          <meshBasicMaterial map={loaded.texture} toneMapped={false} />
        </mesh>
        {/* …and the back face too, so cards on the far side of the ring still
            present a product instead of a blank mat. */}
        <mesh position={[0, 0, -(FRAME_DEPTH / 2 + 0.006)]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[width, PLANE_HEIGHT]} />
          <meshBasicMaterial map={loaded.texture} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

function Carousel({
  products,
  textures,
  drag,
  pointer,
  radius,
}: {
  products: ExperienceProduct[]
  textures: (LoadedTexture | null)[]
  drag: React.MutableRefObject<DragState>
  pointer: React.MutableRefObject<Pointer>
  radius: number
}) {
  const spin = useRef<THREE.Group>(null) // horizontal carousel rotation
  const parallax = useRef<THREE.Group>(null) // tilt/slide toward the pointer
  const [hovered, setHovered] = useState<number | null>(null)

  useFrame(() => {
    const s = spin.current
    if (s) {
      const d = drag.current
      if (d.dragging) {
        s.rotation.y += d.vel
        d.vel *= 0.6
      } else if (Math.abs(d.vel) > 0.0008) {
        s.rotation.y += d.vel
        d.vel *= 0.94
      } else {
        s.rotation.y += 0.0016 // slow idle drift
      }
    }
    const p = parallax.current
    if (p) {
      // Tilt up/down + slide laterally toward the cursor → strong depth cue.
      p.rotation.x = THREE.MathUtils.lerp(p.rotation.x, pointer.current.y * 0.16, 0.06)
      p.position.x = THREE.MathUtils.lerp(p.position.x, pointer.current.x * 0.3, 0.06)
    }
  })

  useEffect(() => {
    document.body.style.cursor = hovered !== null ? 'pointer' : ''
    return () => {
      document.body.style.cursor = ''
    }
  }, [hovered])

  return (
    <group ref={parallax}>
      <group ref={spin}>
        {products.map((product, i) => {
          const loaded = textures[i]
          if (!loaded) return null
          return (
            <Card
              key={product.slug}
              product={product}
              loaded={loaded}
              index={i}
              count={products.length}
              radius={radius}
              hovered={hovered === i}
              onHover={setHovered}
              drag={drag}
            />
          )
        })}
      </group>
    </group>
  )
}

/**
 * Lives inside <Canvas> so it can read the live viewport aspect and size the
 * ring to the screen — tighter on phones so the carousel's curve stays legible.
 */
function Scene({
  products,
  textures,
  drag,
  pointer,
}: {
  products: ExperienceProduct[]
  textures: (LoadedTexture | null)[]
  drag: React.MutableRefObject<DragState>
  pointer: React.MutableRefObject<Pointer>
}) {
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)
  const radius = ringRadius(products.length, width / height)

  return (
    <>
      <CameraRig radius={radius} />
      <Carousel products={products} textures={textures} drag={drag} pointer={pointer} radius={radius} />
      {/* Grounds the ring in space — the single biggest "3D room" cue. */}
      <ContactShadows
        position={[0, -1.55, 0]}
        opacity={0.45}
        scale={radius * 2.4}
        blur={2.6}
        far={4}
        resolution={256}
        color="#3a2f22"
      />
    </>
  )
}

export function ExperienceCanvas({
  products,
  quotes,
}: {
  products: ExperienceProduct[]
  quotes: ExperienceQuote[]
}) {
  const urls = useMemo(() => products.map((p) => p.texture), [products])
  const textures = useProductTextures(urls)
  const drag = useRef<DragState>({ dragging: false, lastX: 0, vel: 0, moved: false })
  const pointer = useRef<Pointer>({ x: 0, y: 0 })
  const [quoteIndex, setQuoteIndex] = useState(0)

  const ready = textures.length > 0

  // Gentle quote rotation. detectTier() already excluded reduced-motion users,
  // so motion here is safe; still slow and non-distracting.
  useEffect(() => {
    if (quotes.length < 2) return
    const id = setInterval(() => setQuoteIndex((q) => (q + 1) % quotes.length), 7000)
    return () => clearInterval(id)
  }, [quotes.length])

  function updatePointer(e: React.PointerEvent) {
    const r = e.currentTarget.getBoundingClientRect()
    pointer.current = {
      x: ((e.clientX - r.left) / r.width) * 2 - 1,
      y: ((e.clientY - r.top) / r.height) * 2 - 1,
    }
  }
  function onPointerDown(e: React.PointerEvent) {
    drag.current = { dragging: true, lastX: e.clientX, vel: 0, moved: false }
  }
  function onPointerMove(e: React.PointerEvent) {
    updatePointer(e) // parallax tracks the pointer even when not dragging
    const d = drag.current
    if (!d.dragging) return
    const dx = e.clientX - d.lastX
    d.lastX = e.clientX
    d.vel = dx * 0.004
    if (Math.abs(dx) > 2) d.moved = true
  }
  function endDrag() {
    drag.current.dragging = false
  }

  const quote = quotes[quoteIndex]

  return (
    // Fill the viewport minus the sticky shop header (h-14 mobile / h-16 md).
    <div className="relative h-[calc(100svh-3.5rem)] md:h-[calc(100svh-4rem)] w-full bg-[#efe8dd] touch-none select-none overflow-hidden">
      <Canvas
        dpr={cappedDpr()}
        shadows
        camera={{ position: [0, 0.5, CAMERA_GAP + 4], fov: CAMERA_FOV }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <color attach="background" args={[BG]} />
        {/* Soft, directional light models the cream frames so cards read as
            physical objects. The photos stay unlit (meshBasic) for true colour. */}
        <ambientLight intensity={0.85} />
        <directionalLight position={[3.5, 5, 4]} intensity={1.15} castShadow />
        <directionalLight position={[-4, 2, -2]} intensity={0.35} />
        {ready && <Scene products={products} textures={textures} drag={drag} pointer={pointer} />}
      </Canvas>

      {/* Quote overlay — real DOM text: selectable, accessible, crisp. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-10 text-center">
        <div key={quoteIndex} className="max-w-xl animate-[fadeIn_700ms_ease]">
          <p className="font-serif text-xl md:text-3xl font-light leading-snug text-foreground/90">
            {quote?.text}
          </p>
          {quote?.attribution && (
            <p className="mt-3 font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground">
              {quote.attribution}
            </p>
          )}
        </div>
      </div>

      {/* Affordance + escape hatch back to the catalogue. */}
      <p className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 font-sans text-[11px] tracking-[0.25em] uppercase text-muted-foreground">
        Drag to explore · Tap a piece to shop
      </p>

      {/* Opaque while textures upload, then fades out to reveal the scene —
          so products appear as one intentional reveal, not a pop-in. */}
      <ShowroomLoading hidden={ready} />

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  )
}
