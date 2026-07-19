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
      <Bloom mipmapBlur levels={9} intensity={1.5} luminanceThreshold={1} luminanceSmoothing={1} />
      <LUT lut={lut} />
    </EffectComposer>
  )
}

export function ProjectsPage() {
  return (
    <>
      <div className="scene-layer" style={{ background: 'black' }}>
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
