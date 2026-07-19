import * as THREE from 'three'
import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { Rainbow, type RainbowMaterialImpl } from '../projects/prism/Rainbow'
import { BrandMark } from '../../components/ui/Logo'
import './resume.css'

// Non-interactive port of the prism rainbow: the same spectral shader from the
// Projects page, but fixed in place (no pointer beam / refraction). It shines
// from a point source at the bottom of the page straight up, and only shimmers
// via the shader's `time` uniform, so it reads as flowing and radiating without
// ever moving.
function RainbowFX() {
  const rainbow = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    const mesh = rainbow.current
    if (!mesh) return
    const mat = mesh.material as RainbowMaterialImpl
    // Faster spectral flow than the interactive default, plus a slow breathing
    // of intensity so the beam gently pulses (radiates) in place.
    mat.speed = 2
    mat.emissiveIntensity = 2.1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.35
    // Apex (point source) near the bottom edge, fanning straight up (rotation
    // +90°) so the spectrum shines from the bottom of the page upward. The apex
    // sits ~88% down, responsive to aspect ratio so it lands the same on desktop
    // and mobile — a fixed world y would fall off short/tall viewports.
    mesh.rotation.z = Math.PI / 2
    const vp = state.viewport
    mesh.position.x = 0
    mesh.position.y = -(vp.height / 2) * 0.78
  })
  return <Rainbow ref={rainbow} startRadius={0} endRadius={0.58} fade={0} />
}

// Coming-soon page: pure visual — a fixed rainbow behind a large white logo,
// the page title, and a caption. Nothing here is interactive.
export function ResumePage() {
  return (
    <div className="resume-page">
      <Canvas
        orthographic
        gl={{ antialias: false }}
        camera={{ position: [0, 0, 100], zoom: 70 }}
      >
        <color attach="background" args={['black']} />
        <Suspense fallback={null}>
          <RainbowFX />
          <EffectComposer>
            <Bloom mipmapBlur levels={9} intensity={1.4} luminanceThreshold={1} luminanceSmoothing={1} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      <div className="resume-overlay">
        <BrandMark
          height={58}
          style={{ marginBottom: '0.4rem', filter: 'drop-shadow(0 2px 18px rgba(0, 0, 0, 0.55))' }}
        />
        <h1>Resume / CV</h1>
        <p>Coming soon</p>
      </div>
    </div>
  )
}
