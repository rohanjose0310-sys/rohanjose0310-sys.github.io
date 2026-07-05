import { Suspense } from 'react'
import { Link } from 'react-router-dom'
import { Canvas, useLoader } from '@react-three/fiber'
import { Bloom, EffectComposer, LUT } from '@react-three/postprocessing'
import { LUTCubeLoader, type LookupTexture } from 'postprocessing'
import { PrismScene } from './PrismScene'

import lutTexture from './assets/F-6800-STD.cube?url'

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
      <div style={{ position: 'fixed', inset: 0, background: 'black' }}>
        <Canvas orthographic gl={{ antialias: false }} camera={{ position: [0, 0, 100], zoom: 70 }}>
          <color attach="background" args={['black']} />
          <Suspense fallback={null}>
            <PrismScene />
            <Effects />
          </Suspense>
        </Canvas>
      </div>

      <Link
        to="/"
        style={{
          position: 'fixed',
          top: '2rem',
          left: '2rem',
          zIndex: 1,
          color: 'var(--accent)',
          fontSize: '0.9rem',
        }}
      >
        ← Back home
      </Link>
    </>
  )
}
