'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * The hero crystal — a large faceted icosahedron that catches light
 * like a cut crystal bead. As the user scrolls through the Craft
 * section, it slowly rotates and grows.
 */
function CrystalCore({ progress }: { progress: number }) {
  const mesh = useRef<THREE.Mesh>(null)
  useFrame((state, delta) => {
    if (!mesh.current) return
    mesh.current.rotation.y += delta * 0.18 + progress * 0.015
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.18 + progress * 0.55
    const s = 1 + progress * 0.3
    mesh.current.scale.set(s, s, s)
  })
  return (
    <mesh ref={mesh} position={[-1.6, 0, 0]}>
      {/* Faceted icosahedron — the bead's signature geometry */}
      <icosahedronGeometry args={[1.55, 1]} />
      <meshPhysicalMaterial
        color="#ffffff"
        roughness={0.05}
        metalness={0.0}
        transmission={0.95}
        thickness={1.6}
        ior={1.7}
        attenuationColor="#dcc9a6"
        attenuationDistance={2.4}
        clearcoat={1}
        clearcoatRoughness={0.05}
        iridescence={0.9}
        iridescenceIOR={1.5}
        iridescenceThicknessRange={[120, 900]}
        specularIntensity={1}
        envMapIntensity={1.4}
      />
    </mesh>
  )
}

/**
 * Constellation of orbiting crystal beads — assorted faceted shapes
 * (octahedra, icosahedra, dodecahedra) to read as "bead workshop"
 * rather than uniform pearls.
 */
function BeadConstellation({ progress }: { progress: number }) {
  const group = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!group.current) return
    group.current.rotation.y = state.clock.elapsedTime * 0.06 + progress * 1.4
    group.current.rotation.x = progress * 0.5
  })

  const beads = Array.from({ length: 44 }, (_, i) => {
    const a = (i / 44) * Math.PI * 2
    const r = 2.6 + Math.sin(i * 7.3) * 0.5
    const y = Math.sin(i * 2.1) * 1.1
    return {
      pos: [Math.cos(a) * r - 1.6, y, Math.sin(a) * r] as [number, number, number],
      scale: 0.09 + (i % 5) * 0.022,
      shape: i % 3, // 0=octa, 1=icosa, 2=dodec
      tint: ['#f5e6c4', '#ffffff', '#e9d8a6', '#caa472', '#fff5e1'][i % 5],
      spinAxis: (i % 2) as 0 | 1,
    }
  })

  const refs = useRef<(THREE.Mesh | null)[]>([])
  useFrame((_, delta) => {
    for (let i = 0; i < beads.length; i++) {
      const m = refs.current[i]
      if (!m) continue
      if (beads[i].spinAxis === 0) m.rotation.y += delta * 0.6
      else m.rotation.x += delta * 0.5
    }
  })

  return (
    <group ref={group}>
      {beads.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          position={b.pos}
          scale={b.scale}
        >
          {b.shape === 0 ? (
            <octahedronGeometry args={[1, 0]} />
          ) : b.shape === 1 ? (
            <icosahedronGeometry args={[1, 0]} />
          ) : (
            <dodecahedronGeometry args={[1, 0]} />
          )}
          <meshPhysicalMaterial
            color={b.tint}
            roughness={0.08}
            metalness={0.1}
            transmission={0.7}
            thickness={0.6}
            ior={1.55}
            clearcoat={1}
            clearcoatRoughness={0.1}
            iridescence={0.5}
            iridescenceIOR={1.4}
            envMapIntensity={1.2}
          />
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
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 5]} intensity={2.0} color="#fff4dc" />
      <pointLight position={[-4, -2, 3]} intensity={1.4} color="#caa472" />
      <pointLight position={[3, 2, -4]} intensity={1.0} color="#f5e6c4" />
      <pointLight position={[0, -3, 2]} intensity={0.6} color="#ffffff" />
      <CrystalCore progress={progress} />
      <BeadConstellation progress={progress} />
    </Canvas>
  )
}
