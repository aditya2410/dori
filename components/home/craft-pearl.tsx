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
 * "2.5D" product centerpiece. We take the flat product photograph and
 * push it into pseudo-3D with two cheap tricks that don't need any
 * external segmentation or depth-estimation API:
 *
 *  1. Vertex displacement based on per-pixel luminance — bright spots
 *     bulge toward the camera, shadows recede. The model / hand / bag
 *     gets a real silhouette that catches light as the plane rotates.
 *  2. Radial alpha feather + soft warm halo behind the plane, so it
 *     reads as a floating object instead of a rectangular postcard.
 *
 * Material is unlit (raw texture + custom alpha), so it doesn't depend
 * on env maps — the photo always shows true to its source.
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

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMap: { value: texture },
        uAmp: { value: 0.18 },
      },
      transparent: true,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uAmp;
        uniform sampler2D uMap;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          // Per-pixel luminance → push bright pixels forward, dark back.
          vec4 col = texture2D(uMap, uv);
          float lum = dot(col.rgb, vec3(0.299, 0.587, 0.114));
          float depth = (lum - 0.5) * 2.0;
          // Animated breathing of the relief.
          float breathe = sin(uTime * 0.5) * 0.15 + 1.0;
          p.z += depth * uAmp * breathe;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        varying vec2 vUv;
        void main() {
          vec4 col = texture2D(uMap, vUv);
          // Radial alpha feather so edges fade into the warm halo.
          float d = distance(vUv, vec2(0.5));
          float alpha = 1.0 - smoothstep(0.42, 0.55, d);
          // Soft contrast lift so the subject pops on dark background.
          col.rgb = pow(col.rgb, vec3(0.92));
          gl_FragColor = vec4(col.rgb, alpha);
        }
      `,
    })
  }, [texture])

  useFrame((state, delta) => {
    material.uniforms.uTime.value += delta
    if (!mesh.current) return
    mesh.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.22 + progress * 0.35
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.07
    const s = 1 + progress * 0.15
    mesh.current.scale.set(s, s, s)
    mesh.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.08
    mesh.current.position.x = -1.4
  })

  return (
    <group>
      {/* Warm halo */}
      <mesh position={[-1.4, 0, -0.4]}>
        <circleGeometry args={[2.6, 64]} />
        <meshBasicMaterial color="#f5e6c4" transparent opacity={0.22} />
      </mesh>
      <mesh position={[-1.4, 0, -0.6]}>
        <circleGeometry args={[3.2, 64]} />
        <meshBasicMaterial color="#caa472" transparent opacity={0.08} />
      </mesh>
      {/* The "2.5D" product plane — high subdivision so the luminance
          displacement can deform per-pixel. */}
      <mesh ref={mesh}>
        <planeGeometry args={[2.3, 3.0, 96, 128]} />
        <primitive object={material} attach="material" />
      </mesh>
    </group>
  )
}

/**
 * A tight ring of warm pearls drifting around the product. Soft cream
 * spheres only — matches the brand's pearl-bead aesthetic.
 */
function PearlRing({ progress }: { progress: number }) {
  const group = useRef<THREE.Group>(null)
  const pearls = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * Math.PI * 2
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
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} color="#fff4dc" />
      <pointLight position={[-3, -2, 3]} intensity={0.7} color="#caa472" />
      <pointLight position={[3, 2, -2]} intensity={0.5} color="#f5e6c4" />
      <ProductCard productImage={productImage} progress={progress} />
      <PearlRing progress={progress} />
    </Canvas>
  )
}
