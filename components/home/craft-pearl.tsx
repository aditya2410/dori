'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'

interface CraftPearlProps {
  progress: number
  productImage: string
  productName: string
}

/**
 * Central product card — a softly-tilting plane that shows the actual
 * product photograph (a Dori piece). Replaces the previous abstract
 * "crystal core" so the centerpiece is something the customer can
 * recognise and want.
 */
function ProductCard({
  productImage,
  progress,
}: {
  productImage: string
  progress: number
}) {
  const texture = useLoader(THREE.TextureLoader, productImage)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8

  const mesh = useRef<THREE.Mesh>(null)
  useFrame((state, delta) => {
    if (!mesh.current) return
    mesh.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.18 + progress * 0.35
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.06
    const s = 1 + progress * 0.15
    mesh.current.scale.set(s, s, s)
    // Slow vertical bob to feel alive.
    mesh.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.08
    mesh.current.position.x = -1.4
  })

  // Product images are roughly 3:4 portrait.
  return (
    <group>
      {/* Soft warm halo behind the card */}
      <mesh position={[-1.4, 0, -0.4]}>
        <circleGeometry args={[2.4, 64]} />
        <meshBasicMaterial color="#f5e6c4" transparent opacity={0.18} />
      </mesh>
      <mesh ref={mesh}>
        <planeGeometry args={[2.1, 2.8]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.55}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

/**
 * A tight ring of warm pearls orbiting the product card. Soft cream
 * spheres only (no faceted geometry, no glass) so the look matches
 * the brand's pearl-bag aesthetic — not a sci-fi galaxy.
 */
function PearlRing({ progress }: { progress: number }) {
  const group = useRef<THREE.Group>(null)

  const pearls = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * Math.PI * 2
        // Tight elliptical orbit, mostly behind / around the card.
        const r = 2.2 + Math.sin(i * 1.7) * 0.15
        const y = Math.sin(i * 1.3) * 0.6
        return {
          pos: [Math.cos(a) * r - 1.4, y, Math.sin(a) * r * 0.55] as [number, number, number],
          scale: 0.11 + (i % 4) * 0.025,
          tint: ['#f5e6c4', '#fff5e1', '#e9d8a6', '#caa472'][i % 4],
        }
      }),
    []
  )

  useFrame((state) => {
    if (!group.current) return
    // Slow, single-direction drift. No frantic spin.
    group.current.rotation.y = state.clock.elapsedTime * 0.08 + progress * 0.5
  })

  return (
    <group ref={group}>
      {pearls.map((p, i) => (
        <mesh key={i} position={p.pos} scale={p.scale}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhysicalMaterial
            color={p.tint}
            roughness={0.22}
            metalness={0.15}
            clearcoat={0.7}
            clearcoatRoughness={0.25}
            iridescence={0.35}
            iridescenceIOR={1.3}
            envMapIntensity={1.0}
          />
        </mesh>
      ))}
    </group>
  )
}

export function CraftPearl({ progress, productImage, productName }: CraftPearlProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.2], fov: 42 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      style={{ width: '100%', height: '100%' }}
      aria-label={`A floating Dori ${productName} surrounded by pearls`}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} color="#fff4dc" />
      <pointLight position={[-3, -2, 3]} intensity={0.8} color="#caa472" />
      <pointLight position={[3, 2, -2]} intensity={0.5} color="#f5e6c4" />
      <ProductCard productImage={productImage} progress={progress} />
      <PearlRing progress={progress} />
    </Canvas>
  )
}
