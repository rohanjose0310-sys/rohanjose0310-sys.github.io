import { useRef, type ReactNode } from 'react'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import { IS_TOUCH } from '../../lib/touch'
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
      // Touch: the model toggles the description open, and a tap anywhere that
      // isn't the model dismisses it — except on the description itself or the
      // model menu, where a tap is either incidental or a deliberate switch.
      onPointerMissed={(e) => {
        if (!IS_TOUCH || isChromeTap(e.target)) return
        store.open = false
      }}
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

// A tap on the description (or the model menu) is a reading/selection gesture,
// not a scene one. It needs its own check rather than falling out of the
// raycast: at phone width the description sits directly over the model, so the
// model is hit underneath it and tapping the copy would otherwise dismiss it.
const isChromeTap = (target: EventTarget | null) =>
  !!(target as HTMLElement | null)?.closest?.('.info, .model-menu')

// Desktop drives the lens by hover; touch has no hover, so the model is a
// toggle — tap to open the description, tap off it to dismiss (see the Canvas's
// onPointerMissed). Press-and-hold is gone: holding a 3D object also started
// iOS's text selection on the description underneath it.
const selectHandlers = IS_TOUCH
  ? {
      onClick: (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        if (isChromeTap(e.nativeEvent.target)) return
        store.open = !store.open
      },
    }
  : {
      onPointerOver: () => (store.open = true),
      onPointerOut: () => (store.open = false),
      onPointerDown: () => (store.open = true),
      onPointerUp: () => (store.open = false),
    }

function Selector({ children }: { children: ReactNode }) {
  const ref = useRef<Mesh>(null!)
  useFrame(({ viewport, camera, pointer }, delta) => {
    const { width, height } = viewport.getCurrentViewport(camera, [0, 0, 3])
    easing.damp3(ref.current.position, [(pointer.x * width) / 2, (pointer.y * height) / 2, 3], store.open ? 0 : 0.1, delta)
    // Closed, the lens is a 0.01 seed that trails the cursor. Touch has no
    // cursor to trail, so that seed just parks mid-screen as a small grey disc
    // with nothing to do — collapse it to nothing there and let the tap grow it.
    easing.damp3(ref.current.scale, store.open ? 4 : IS_TOUCH ? 0 : 0.01, store.open ? 0.5 : 0.2, delta)
    easing.dampC((ref.current.material as MeshStandardMaterial).color, store.open ? '#f0f0f0' : '#ccc', 0.1, delta)
  })
  return (
    <>
      <mesh ref={ref}>
        <circleGeometry args={[1, 64, 64]} />
        <MeshTransmissionMaterial samples={10} resolution={256} anisotropicBlur={0.1} thickness={0.1} roughness={0.4} toneMapped={true} />
      </mesh>
      <group {...selectHandlers}>{children}</group>
    </>
  )
}

