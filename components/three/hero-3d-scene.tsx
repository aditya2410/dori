'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useLoader, type ThreeElements } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Curved plane displaying the hero image with a subtle vertex-shader
 * "fabric ripple" displacement + a tilt that tracks the cursor. Designed
 * to feel like the brand's handcrafted fabric breathing.
 */
function FabricPlane({ texture }: { texture: THREE.Texture }) {
  const mesh = useRef<THREE.Mesh>(null)
  const target = useRef({ x: 0, y: 0 })

  // GPU-side animated displacement using a shader material.
  const material = useMemo(() => {
    const uniforms = {
      uTime: { value: 0 },
      uMap: { value: texture },
      uAmp: { value: 0.06 }, // ripple amplitude
      uFreq: { value: 2.4 }, // ripple frequency
    }
    return new THREE.ShaderMaterial({
      uniforms,
      transparent: false,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uAmp;
        uniform float uFreq;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          float w =
            sin(p.x * uFreq + uTime * 0.7) * 0.5 +
            cos(p.y * uFreq * 0.8 + uTime * 0.6) * 0.5;
          p.z += w * uAmp;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        varying vec2 vUv;
        void main() {
          vec4 col = texture2D(uMap, vUv);
          // Subtle vignette toward the bottom (matches the 2D gradient overlay).
          float v = smoothstep(0.0, 1.0, 1.0 - vUv.y);
          col.rgb *= mix(0.65, 1.0, v);
          gl_FragColor = col;
        }
      `,
    })
  }, [texture])

  useFrame((state, delta) => {
    material.uniforms.uTime.value += delta
    if (!mesh.current) return

    // Cursor parallax target.
    const px = (state.pointer.x ?? 0) * 0.18
    const py = (state.pointer.y ?? 0) * 0.12
    target.current.x = px
    target.current.y = py

    // Smooth easing.
    mesh.current.rotation.y += (target.current.x - mesh.current.rotation.y) * 0.06
    mesh.current.rotation.x += (-target.current.y - mesh.current.rotation.x) * 0.06
  })

  // 3:4 aspect plane.
  return (
    <mesh ref={mesh} position={[0, 0, 0]}>
      <planeGeometry args={[3.6, 4.8, 80, 100]} />
      {/* shader material is created with new, attach as primitive */}
      <primitive object={material} attach="material" />
    </mesh>
  )
}

function DustParticles({ count = 220 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 8
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4 + 1
      speeds[i] = 0.05 + Math.random() * 0.12
    }
    return { positions, speeds }
  }, [count])

  useFrame((_, delta) => {
    const points = ref.current
    if (!points) return
    const pos = points.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < count; i++) {
      const idx = i * 3 + 1
      let y = pos.array[idx] as number
      y += speeds[i] * delta * 0.5
      if (y > 3) y = -3
      ;(pos.array as Float32Array)[idx] = y
    }
    pos.needsUpdate = true
    points.rotation.y += delta * 0.02
  })

  const args: ThreeElements['bufferAttribute']['args'] = [positions, 3]

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={args} />
      </bufferGeometry>
      <pointsMaterial
        size={0.022}
        sizeAttenuation
        color="#e9d8a6"
        transparent
        opacity={0.65}
        depthWrite={false}
      />
    </points>
  )
}

function Scene({ imageSrc }: { imageSrc: string }) {
  const texture = useLoader(THREE.TextureLoader, imageSrc)
  // Improve perceived sharpness.
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 3, 4]} intensity={0.8} />
      <FabricPlane texture={texture} />
      <DustParticles />
      <Environment preset="warehouse" environmentIntensity={0.2} />
    </>
  )
}

export function Hero3DScene({ imageSrc }: { imageSrc: string }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.4], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#1a1614']} />
      <Scene imageSrc={imageSrc} />
      {/* Disabled by default — purely ambient cursor parallax. */}
      <OrbitControls enabled={false} />
    </Canvas>
  )
}
