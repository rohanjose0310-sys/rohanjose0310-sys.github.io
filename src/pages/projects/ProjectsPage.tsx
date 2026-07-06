import { Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { Bloom, EffectComposer, LUT } from '@react-three/postprocessing'
import { LUTCubeLoader, type LookupTexture } from 'postprocessing'
import { PrismScene } from './PrismScene'

import lutTexture from './assets/F-6800-STD.cube?url'

// Scale the orthographic zoom to the viewport: 60 gives breathing room on
// desktop (the demo's 70 filled the frame edge-to-edge), and narrow screens
// zoom out further so the caption and boxes fit with negative space.
function FitZoom() {
  useFrame((state) => {
    const zoom = Math.min(60, state.size.width / 9.5)
    if (state.camera.zoom !== zoom) {
      state.camera.zoom = zoom
      state.camera.updateProjectionMatrix()
    }
  })
  return null
}

function Effects() {
  const lut = useLoader(LUTCubeLoader, lutTexture) as LookupTexture
  return (
    <EffectComposer>
      {/* The demo pins three@0.165 / @react-three/postprocessing@2.x; this
          site runs three@0.185 / @react-three/postprocessing@3.x. Bloom's
          mipmap-blur has changed across that gap — the demo's intensity=1.5
          reads as a contained rainbow trail there, but whites out the whole
          frame on this version combo on real GPUs (confirmed on device;
          this project's software-rendered test browser can't reproduce
          real-GPU bloom, so this value is calibrated from live feedback,
          not local verification). */}
      <Bloom mipmapBlur levels={9} intensity={0.5} luminanceThreshold={1.1} luminanceSmoothing={0.5} />
      <LUT lut={lut} />
    </EffectComposer>
  )
}

export function ProjectsPage() {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'black' }}>
        <Canvas orthographic gl={{ antialias: false }} camera={{ position: [0, 0, 100], zoom: 60 }}>
          <color attach="background" args={['black']} />
          <FitZoom />
          <Suspense fallback={null}>
            <PrismScene />
            <Effects />
          </Suspense>
        </Canvas>
      </div>
    </>
  )
}
