'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * A stylised handbag silhouette built entirely from primitives —
 * a rounded body + a tubular handle + a clasp dot. Looks like a
 * Dori clutch / pearl-bag without needing any external asset.
 */
function BagSilhouette({ progress }: { progress: number }) {
  const group = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (!group.current) return
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.35 + progress * 0.5
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.08
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.1 + 0.1
  })

  return (
    <group ref={group} position={[-1.6, 0, 0]}>
      {/* Body — rounded box with a luxurious cream finish */}
      <mesh castShadow position={[0, -0.1, 0]}>
        <boxGeometry args={[1.6, 1.3, 0.5]} />
        <meshPhysicalMaterial
          color="#efe1c4"
          roughness={0.35}
          metalness={0.15}
          clearcoat={0.7}
          clearcoatRoughness={0.3}
          sheen={1}
          sheenColor="#fff5e1"
          sheenRoughness={0.4}
        />
      </mesh>

      {/* Flap shadow — a slightly darker top "lid" suggestion */}
      <mesh position={[0, 0.35, 0.255]}>
        <boxGeometry args={[1.6, 0.6, 0.02]} />
        <meshStandardMaterial color="#d9c79f" roughness={0.5} />
      </mesh>

      {/* Brass clasp */}
      <mesh position={[0, 0.1, 0.27]}>
        <cylinderGeometry args={[0.08, 0.08, 0.04, 32]} />
        <meshStandardMaterial color="#caa472" metalness={0.9} roughness={0.25} />
      </mesh>

      {/* Handle — torus loop on top */}
      <mesh position={[0, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.045, 16, 64, Math.PI]} />
        <meshStandardMaterial color="#caa472" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Beadwork row across the front — 12 mini pearls */}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[-0.62 + i * 0.115, -0.5, 0.27]} scale={0.055}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshPhysicalMaterial
            color="#fff5e1"
            roughness={0.18}
            metalness={0.2}
            clearcoat={1}
            iridescence={0.3}
          />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Sewing-thread strand — a thin tube that gently waves through space,
 * suggesting the artisan's craft.
 */
function ThreadStrand() {
  const ref = useRef<THREE.Mesh>(null)
  const curve = useMemo(() => {
    const pts = [
      new THREE.Vector3(-3.6, -1.8, -0.4),
      new THREE.Vector3(-2.4, -0.6, 0.6),
      new THREE.Vector3(-0.8, 0.4, -0.3),
      new THREE.Vector3(0.6, -0.2, 0.5),
      new THREE.Vector3(2.4, 1.2, -0.2),
      new THREE.Vector3(3.6, 0.5, 0.3),
    ]
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5)
  }, [])
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 120, 0.012, 8, false), [curve])

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.05
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.08
  })

  return (
    <mesh ref={ref} geometry={geometry}>
      <meshBasicMaterial color="#caa472" transparent opacity={0.55} />
    </mesh>
  )
}

/** Soft pearls drifting around the bag (warm cream, no faceted shapes). */
function PearlCloud({ progress }: { progress: number }) {
  const group = useRef<THREE.Group>(null)
  const pearls = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        const a = (i / 22) * Math.PI * 2
        const r = 2.4 + Math.sin(i * 1.7) * 0.2
        const y = Math.sin(i * 1.3) * 0.7
        return {
          pos: [Math.cos(a) * r - 1.6, y, Math.sin(a) * r * 0.55] as [number, number, number],
          scale: 0.09 + (i % 4) * 0.022,
          tint: ['#f5e6c4', '#fff5e1', '#e9d8a6', '#caa472'][i % 4],
        }
      }),
    []
  )
  useFrame((state) => {
    if (!group.current) return
    group.current.rotation.y = state.clock.elapsedTime * 0.06 + progress * 0.4
  })
  return (
    <group ref={group}>
      {pearls.map((p, i) => (
        <mesh key={i} position={p.pos} scale={p.scale}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshPhysicalMaterial
            color={p.tint}
            roughness={0.22}
            metalness={0.18}
            clearcoat={0.7}
            iridescence={0.3}
          />
        </mesh>
      ))}
    </group>
  )
}

export function CraftPearl({ progress }: { progress: number; productImage?: string; productName?: string }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.4], fov: 42 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Warm workshop lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} color="#fff4dc" />
      <pointLight position={[-3, -2, 3]} intensity={1.0} color="#caa472" />
      <pointLight position={[3, 2, -2]} intensity={0.7} color="#f5e6c4" />
      <pointLight position={[0, -3, 1]} intensity={0.5} color="#fff5e1" />

      <BagSilhouette progress={progress} />
      <PearlCloud progress={progress} />
      <ThreadStrand />
    </Canvas>
  )
}
