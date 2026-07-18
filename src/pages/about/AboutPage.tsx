import { Link } from 'react-router-dom'
import { Preload, Scroll, ScrollControls } from '@react-three/drei'
import { SceneCanvasLayout } from '../../layout/SceneCanvasLayout'
import { Images, Lens, Typography } from './LensScene'
import './about.css'

// pmndrs "scrollcontrols-and-lens-refraction" layout: three scroll pages of
// images + typography, viewed through a pointer-tracked refractive lens.
// Copy text and images are demo placeholders (replaced with real content later).
export function AboutPage() {
  return (
    <>
      <SceneCanvasLayout camera={{ position: [0, 0, 20], fov: 15 }} backdrop="#d8d7d7">
        <ScrollControls damping={0.2} pages={3} distance={0.5}>
          <Lens>
            <Scroll>
              <Typography />
              <Images />
            </Scroll>
            <Scroll html>
              <div className="about-copy">
                Years in code, a short detour through startup life, then design - because that's where the
                future gets drawn first. Now I build technology, wearable or not, hoping some of it helps us
                reach further out.
              </div>
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
