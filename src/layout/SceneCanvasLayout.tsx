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
    // iOS Safari sizes `position: fixed; inset: 0` against the "small"
    // viewport (stops short of its bottom toolbar) regardless of
    // viewport-fit=cover. Explicit width/height in dvh (the viewport unit
    // that tracks Safari's actual dynamic chrome) is what's needed for the
    // canvas to genuinely reach the real screen edge instead of clipping.
    // Harmless elsewhere — dvh equals vh wherever there's no dynamic chrome.
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', background: backdrop }}>
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
