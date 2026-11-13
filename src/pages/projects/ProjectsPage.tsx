import { Suspense, useCallback } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { Bloom, EffectComposer, LUT } from '@react-three/postprocessing'
import { LUTCubeLoader, type LookupTexture } from 'postprocessing'
import { useNavigate } from 'react-router-dom'
import { PrismScene } from './PrismScene'
import { focus } from './focus'
import { HandAim } from './HandAim'
import { AdaptiveSceneDpr } from '../../three/AdaptiveSceneDpr'
import { HANDS_SUPPORTED } from '../../gestures/flag'
import { IS_TOUCH } from '../../lib/touch'

import lutTexture from './assets/F-6800-STD.cube?url'

// Scale the orthographic zoom to the viewport: 60 gives breathing room on
// desktop (the demo's 70 filled the frame edge-to-edge), and narrow screens
// zoom out further so the caption and boxes fit with negative space. The
// divisor keeps ~6 world units either side of centre, enough for the outer
// diamonds (Tratto at x -5, Interference at x 4.5) on a 375 px phone.
function FitZoom() {
  useFrame((state) => {
    const zoom = Math.min(60, state.size.width / 12)
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
  const navigate = useNavigate()

  // Aim the beam at a diamond, then click anywhere to open that project.
  // The cursor is the beam's origin, so it can't be asked to travel to a
  // button without re-aiming the beam and losing the very card it is heading
  // for (see focus.ts). Instead the click can land wherever the cursor already
  // is — which, on a click that hit nothing, is exactly onPointerMissed.
  // Clicks that DO hit something (the back arrow, a diamond) don't fire this,
  // so those keep their own handlers. `focus.id` is read straight off the
  // proxy rather than through useProxy: this wants the value at click time and
  // has no reason to re-render the page when it changes.
  const openFocused = useCallback(() => {
    if (IS_TOUCH) return // no beam without a cursor; the card's button is the way in
    if (focus.id) navigate(`/projects/${focus.id}`)
  }, [navigate])

  return (
    <>
      <div className="scene-layer" style={{ background: 'black' }}>
        <Canvas
          orthographic
          gl={{ antialias: false }}
          camera={{ position: [0, 0, 100], zoom: 60 }}
          onPointerMissed={openFocused}
        >
          <color attach="background" args={['black']} />
          {/* Not the full <PerfGuardrails>: this page keeps its own framerate
              behaviour, but bloom + LUT at full pixel ratio is the least
              affordable scene here, so it takes the hand-mode dpr backoff. */}
          <AdaptiveSceneDpr />
          <FitZoom />
          <Suspense fallback={null}>
            <PrismScene />
            <Effects />
          </Suspense>
        </Canvas>
      </div>
      {/* Outside the Canvas: it owns an rAF loop and a DOM chip, neither of
          which belongs in the scene graph. No-ops until tracking is running. */}
      {HANDS_SUPPORTED && <HandAim />}
    </>
  )
}
