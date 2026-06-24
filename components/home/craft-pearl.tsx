'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function PearlOrb({ progress }: { progress: number }) {
  const mesh = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    if (!mesh.current) return
    // Constant idle rotation + scroll-driven spin.
    mesh.current.rotation.y += delta * 0.2 + progress * 0.02
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1 + progress * 0.4
    // Slight scale growth as the user scrolls deeper.
    const s = 1 + progress * 0.25
    mesh.current.scale.set(s, s, s)
  })

  return (
    <mesh ref={mesh} position={[-1.6, 0, 0]}>
      <sphereGeometry args={[1.4, 96, 96]} />
      <meshPhysicalMaterial
        color="#f5e6c4"
        roughness={0.12}
        metalness={0.35}
        clearcoat={1}
        clearcoatRoughness={0.18}
        reflectivity={0.85}
        iridescence={0.7}
        iridescenceIOR={1.4}
        iridescenceThicknessRange={[100, 800]}
        emissive="#3a2a14"
        emissiveIntensity={0.15}
      />
    </mesh>
  )
}

function Constellation({ progress }: { progress: number }) {
  const group = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!group.current) return
    group.current.rotation.y = state.clock.elapsedTime * 0.05 + progress * 1.2
    group.current.rotation.x = progress * 0.4
  })
  // 40 tiny pearls orbiting the main one.
  const pearls = Array.from({ length: 40 }, (_, i) => {
    const a = (i / 40) * Math.PI * 2
    const r = 2.6 + Math.sin(i * 7.3) * 0.4
    const y = Math.sin(i * 2.1) * 0.9
    return {
      pos: [Math.cos(a) * r - 1.6, y, Math.sin(a) * r] as [number, number, number],
      s: 0.07 + (i % 5) * 0.015,
    }
  })
  return (
    <group ref={group}>
      {pearls.map((p, i) => (
        <mesh key={i} position={p.pos} scale={p.s}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial color="#e9d8a6" metalness={0.5} roughness={0.25} />
        </mesh>
      ))}
    </group>
  )
}

export function CraftPearl({ progress }: { progress: number }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.5], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 5]} intensity={1.8} color="#fff4dc" />
      <pointLight position={[-4, -2, 3]} intensity={1.2} color="#caa472" />
      <pointLight position={[3, 2, -4]} intensity={0.8} color="#f5e6c4" />
      <PearlOrb progress={progress} />
      <Constellation progress={progress} />
    </Canvas>
  )
}
