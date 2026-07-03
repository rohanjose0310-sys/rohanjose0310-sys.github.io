import type { ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerfGuardrails } from '../three/PerfGuardrails'

// Full-viewport Canvas shared by all 3D pages. Pages pass their scene as
// children; DOM overlays (hero text, UI) render as siblings of this component.
export function SceneCanvasLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.4, 7], fov: 45 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <PerfGuardrails>{children}</PerfGuardrails>
      </Canvas>
    </div>
  )
}
