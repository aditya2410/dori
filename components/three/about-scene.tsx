'use client'

import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Floating "pearl" cluster — a slow drifting field of warm-gold/pearl
 * spheres meant as a tasteful ambient backdrop for the About page hero,
 * matching the brand's pearl + handcrafted-bead aesthetic.
 *
 * No external HDR / drei dependencies — all lighting is set up locally
 * so the scene can't fail to mount because of a CDN miss.
 */

type PearlData = {
  position: [number, number, number]
  scale: number
  color: string
  phase: number
  freq: number
  amp: number
}

function Pearls({ count = 22 }: { count?: number }) {
  const group = useRef<THREE.Group>(null)
  const items = useMemo<PearlData[]>(
    () =>
      Array.from({ length: count }, () => ({
        position: [
          (Math.random() - 0.5) * 7,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4 - 1,
        ],
        scale: 0.18 + Math.random() * 0.32,
        color: ['#f5e6c4', '#e9d8a6', '#caa472', '#fff5e1'][Math.floor(Math.random() * 4)],
        phase: Math.random() * Math.PI * 2,
        freq: 0.4 + Math.random() * 0.8,
        amp: 0.15 + Math.random() * 0.25,
      })),
    [count]
  )

  const refs = useRef<(THREE.Mesh | null)[]>([])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (group.current) {
      group.current.rotation.y = t * 0.03
      group.current.rotation.x = Math.sin(t * 0.05) * 0.06
    }
    for (let i = 0; i < items.length; i++) {
      const m = refs.current[i]
      const d = items[i]
      if (!m) continue
      m.position.y = d.position[1] + Math.sin(t * d.freq + d.phase) * d.amp
      m.rotation.x = t * d.freq * 0.2
      m.rotation.y = t * d.freq * 0.15
    }
  })

  return (
    <group ref={group}>
      {items.map((it, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          position={it.position}
          scale={it.scale}
        >
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhysicalMaterial
            color={it.color}
            roughness={0.18}
            metalness={0.25}
            clearcoat={0.8}
            clearcoatRoughness={0.2}
            reflectivity={0.6}
            iridescence={0.4}
            iridescenceIOR={1.3}
          />
        </mesh>
      ))}
    </group>
  )
}

export function AboutScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 5]} intensity={1.4} color="#fff4dc" />
        <pointLight position={[-3, -2, 4]} intensity={0.8} color="#caa472" />
        <pointLight position={[4, 2, -2]} intensity={0.6} color="#f5e6c4" />
        <Pearls />
      </Suspense>
    </Canvas>
  )
}
