import type { ReactNode } from 'react'
import { Canvas, type CameraProps } from '@react-three/fiber'
import { PerfGuardrails } from '../three/PerfGuardrails'

const DEFAULT_CAMERA: CameraProps = { position: [0, 0.4, 7], fov: 45 }

// Full-viewport Canvas shared by all 3D pages. Pages pass their scene as
// children; DOM overlays (hero text, UI) render as siblings of this component.
export function SceneCanvasLayout({
  children,
  camera = DEFAULT_CAMERA,
  backdrop,
  dpr = [1, 2],
}: {
  children: ReactNode
  camera?: CameraProps
  /** Page color behind the canvas — visible during the canvas fade-in. */
  backdrop?: string
  /** Device-pixel-ratio clamp; lower the cap on GPU-heavy pages/devices. */
  dpr?: [number, number]
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: backdrop }}>
      <Canvas
        dpr={dpr}
        camera={camera}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <PerfGuardrails>{children}</PerfGuardrails>
      </Canvas>
    </div>
  )
}
