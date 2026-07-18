import { Link } from 'react-router-dom'
import { Preload, Scroll, ScrollControls } from '@react-three/drei'
import { SceneCanvasLayout } from '../../layout/SceneCanvasLayout'
import { Images, Lens, Typography } from './LensScene'
import { IS_TOUCH } from '../../lib/touch'
import './about.css'

const BIO_COPY =
  "Years in code, a short detour through startup life, then design - because that's where the " +
  'future gets drawn first. Now I build technology, wearable or not, hoping some of it helps us ' +
  'reach further out.'

// pmndrs "scrollcontrols-and-lens-refraction" layout: three scroll pages of
// images + typography, viewed through a pointer-tracked refractive lens.
// Copy text and images are demo placeholders (replaced with real content later).
export function AboutPage() {
  return (
    <>
      <SceneCanvasLayout
        camera={{ position: [0, 0, 20], fov: 15 }}
        backdrop="#d8d7d7"
        // Two transmission materials (lens + glass card) are GPU-heavy; cap the
        // pixel ratio on phones so it stays smooth. Desktop keeps full clarity.
        dpr={IS_TOUCH ? [1, 1.5] : [1, 2]}
      >
        <ScrollControls damping={0.2} pages={3} distance={0.5}>
          <Lens>
            <Scroll>
              <Typography />
              <Images />
            </Scroll>
            {/* Bio copy scrolls in as an HTML overlay. Desktop keeps the plain
                black text; touch gets a real frosted-glass card (a backdrop
                blur over the canvas — see .about-glass-card), which reads as
                frosted where a flat translucent 3D panel just looked pale. */}
            <Scroll html>
              <div className={IS_TOUCH ? 'about-glass-card' : 'about-copy'}>{BIO_COPY}</div>
            </Scroll>
            {/** This is a helper that pre-emptively makes threejs aware of all geometries, textures etc
                 By default threejs will only process objects if they are "seen" by the camera leading
                 to jank as you scroll down. With <Preload> that's solved.  */}
            <Preload />
          </Lens>
        </ScrollControls>
      </SceneCanvasLayout>
      <AboutOverlay />
    </>
  )
}

// Static page chrome: back button top-left, bio lines bottom-left, sign-off bottom-right.
function AboutOverlay() {
  return (
    <div className="about-overlay">
      <Link to="/" className="about-back">
        ← back
      </Link>
      <div className="about-bio-lines">
        Coder to Designer
        <br />
        From Accra to Chicago to Melbourne
      </div>
      <div className="about-signoff">Designed with Love</div>
    </div>
  )
}
