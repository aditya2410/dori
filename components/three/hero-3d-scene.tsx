'use client'

import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Curved plane displaying the hero image with a subtle vertex-shader
 * "fabric ripple" displacement + a tilt that tracks the cursor.
 */
function FabricPlane({ texture }: { texture: THREE.Texture }) {
  const mesh = useRef<THREE.Mesh>(null)
  const target = useRef({ x: 0, y: 0 })

  const material = useMemo(() => {
    const uniforms = {
      uTime: { value: 0 },
      uMap: { value: texture },
      uAmp: { value: 0.06 },
      uFreq: { value: 2.4 },
    }
    return new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
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
          float v = smoothstep(0.0, 1.0, 1.0 - vUv.y);
          col.rgb *= mix(0.7, 1.05, v);
          gl_FragColor = col;
        }
      `,
    })
  }, [texture])

  useFrame((state, delta) => {
    material.uniforms.uTime.value += delta
    if (!mesh.current) return
    const px = (state.pointer.x ?? 0) * 0.18
    const py = (state.pointer.y ?? 0) * 0.12
    target.current.x = px
    target.current.y = py
    mesh.current.rotation.y += (target.current.x - mesh.current.rotation.y) * 0.06
    mesh.current.rotation.x += (-target.current.y - mesh.current.rotation.x) * 0.06
  })

  return (
    <mesh ref={mesh}>
      <planeGeometry args={[3.6, 4.8, 80, 100]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

function DustParticles({ count = 200 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const { geometry, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 8
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4 + 1
      speeds[i] = 0.05 + Math.random() * 0.12
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return { geometry, speeds }
  }, [count])

  useFrame((_, delta) => {
    const points = ref.current
    if (!points) return
    const pos = points.geometry.attributes.position as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    for (let i = 0; i < count; i++) {
      const idx = i * 3 + 1
      let y = arr[idx]
      y += speeds[i] * delta * 0.5
      if (y > 3) y = -3
      arr[idx] = y
    }
    pos.needsUpdate = true
    points.rotation.y += delta * 0.02
  })

  return (
    <points ref={ref} geometry={geometry}>
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
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 3, 4]} intensity={0.8} />
      <FabricPlane texture={texture} />
      <DustParticles />
    </>
  )
}

export function Hero3DScene({ imageSrc }: { imageSrc: string }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.4], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <Scene imageSrc={imageSrc} />
      </Suspense>
    </Canvas>
  )
}
