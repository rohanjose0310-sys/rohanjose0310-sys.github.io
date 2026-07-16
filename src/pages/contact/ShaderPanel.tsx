import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { easing } from 'maath'
import { WaveMaterial } from './WaveMaterial'

// One shader-hmr plane filling its own small Canvas. Each panel tracks the
// pointer over itself (r3f's state.pointer is canvas-relative), exactly like
// the demo's fullscreen plane.
function ShaderPlane() {
  const material = useMemo(() => new WaveMaterial(), [])
  const { viewport, size } = useThree()
  const ref = useRef(material)
  material.resolution.set(size.width * viewport.dpr, size.height * viewport.dpr)
  useFrame((state, delta) => {
    ref.current.time += delta
    easing.damp2(ref.current.pointer, state.pointer, 0.2, delta)
  })
  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

export function ShaderPanel({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas dpr={[1, 1.5]}>
        <ShaderPlane />
      </Canvas>
    </div>
  )
}
