import { useRef, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial, ContactShadows, Environment } from '@react-three/drei'
import { easing } from 'maath'
import type { Mesh, MeshStandardMaterial } from 'three'
import { GlbModel } from './GlbModel'
import { store, useStore } from './store'
import { MODELS } from './modelData'

// Port of pmndrs/examples demos/frosted-glass (MIT). A frosted transmission
// lens follows the pointer and snaps open over the model.

export function FrostedScene() {
  return (
    <Canvas
      eventSource={document.getElementById('root') as HTMLElement}
      eventPrefix="client"
      // Cap DPR: the transmission lens renders the scene to a buffer every
      // frame, so 2x on Retina roughly quadruples that cost for no visible gain
      // (the frost is blurred anyway).
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 4], fov: 40 }}
    >
      {/* No PerfGuardrails here: AdaptiveDpr softens the whole canvas, which
          reads as permanent frost on this page. The demo runs without it. */}
      <ambientLight intensity={0.7} />
      <spotLight intensity={0.5} angle={0.1} penumbra={1} position={[10, 15, -5]} castShadow />
      <Environment preset="city" background blur={1} />
      <ContactShadows resolution={512} position={[0, -0.8, 0]} opacity={1} scale={10} blur={2} far={0.8} />
      <Selector>
        <SelectedModel />
      </Selector>
    </Canvas>
  )
}

function SelectedModel() {
  const state = useStore()
  const model = MODELS.find((m) => m.id === state.selectedId) ?? MODELS[0]
  // Only the real CAD exports render geometry; placeholder entries keep their
  // menu/copy but show just the frosted lens over the empty studio (the
  // stand-in shoe has been removed).
  if (model.kind === 'glb' && model.url) {
    return (
      <GlbModel
        key={model.id}
        url={model.url}
        rotation={model.rotation}
        engineMetals={model.id === 'radial-engine'}
        finish={model.finish}
      />
    )
  }
  return null
}

function Selector({ children }: { children: ReactNode }) {
  const ref = useRef<Mesh>(null!)
  useFrame(({ viewport, camera, pointer }, delta) => {
    const { width, height } = viewport.getCurrentViewport(camera, [0, 0, 3])
    easing.damp3(ref.current.position, [(pointer.x * width) / 2, (pointer.y * height) / 2, 3], store.open ? 0 : 0.1, delta)
    easing.damp3(ref.current.scale, store.open ? 4 : 0.01, store.open ? 0.5 : 0.2, delta)
    easing.dampC((ref.current.material as MeshStandardMaterial).color, store.open ? '#f0f0f0' : '#ccc', 0.1, delta)
  })
  return (
    <>
      <mesh ref={ref}>
        <circleGeometry args={[1, 64, 64]} />
        <MeshTransmissionMaterial samples={10} resolution={256} anisotropicBlur={0.1} thickness={0.1} roughness={0.4} toneMapped={true} />
      </mesh>
      <group
        onPointerOver={() => (store.open = true)}
        onPointerOut={() => (store.open = false)}
        onPointerDown={() => (store.open = true)}
        onPointerUp={() => (store.open = false)}>
        {children}
      </group>
    </>
  )
}

