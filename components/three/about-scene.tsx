'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Floating "pearl" cluster — a slow drifting field of warm-gold/pearl
 * spheres meant as a tasteful ambient backdrop for the About page hero,
 * matching the brand's pearl + handcrafted-bead aesthetic.
 *
 * Pure WebGL via R3F; the parent component already gates it behind the
 * `use3DSupport()` check.
 */
function Pearls({ count = 24 }: { count?: number }) {
  const group = useRef<THREE.Group>(null)
  const items = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        position: [
          (Math.random() - 0.5) * 7,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4 - 1,
        ] as [number, number, number],
        scale: 0.18 + Math.random() * 0.32,
        speed: 0.4 + Math.random() * 0.8,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        // warm pearl / gold palette
        color: ['#f5e6c4', '#e9d8a6', '#caa472', '#fff5e1'][Math.floor(Math.random() * 4)],
      })),
    [count]
  )

  useFrame((state) => {
    if (!group.current) return
    group.current.rotation.y = state.clock.elapsedTime * 0.03
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.06
  })

  return (
    <group ref={group}>
      {items.map((it, i) => (
        <Float
          key={i}
          floatIntensity={it.speed}
          rotationIntensity={Math.abs(it.rotSpeed)}
          speed={it.speed}
        >
          <mesh position={it.position} scale={it.scale}>
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
        </Float>
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
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} color="#fff4dc" />
      <pointLight position={[-3, -2, 4]} intensity={0.6} color="#caa472" />
      <Pearls />
      <Environment preset="warehouse" environmentIntensity={0.3} />
    </Canvas>
  )
}
