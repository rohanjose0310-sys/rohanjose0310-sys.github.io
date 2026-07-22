import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Preload, Scroll, ScrollControls } from '@react-three/drei'
import { SceneCanvasLayout } from '../../layout/SceneCanvasLayout'
import { AdaptiveMark } from '../../components/ui/Logo'
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

// Keep --about-vv-inset in sync with the gap the iOS Safari bottom toolbar
// leaves below the visual viewport, so the fixed touch footer can sit above it
// (bottom = inset + margin). On non-toolbar browsers the inset is 0, so the
// footer just sits at its margin — desktop and other browsers are unaffected.
function useVisualViewportInset() {
  useEffect(() => {
    const vv = window.visualViewport
    if (!IS_TOUCH || !vv) return
    const update = () => {
      const inset = Math.max(0, document.documentElement.clientHeight - vv.height - vv.offsetTop)
      document.documentElement.style.setProperty('--about-vv-inset', `${inset}px`)
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      document.documentElement.style.removeProperty('--about-vv-inset')
    }
  }, [])
}

// Static page chrome: back button top-left. The bio lines / sign-off are fixed
// too — on desktop they're always visible (black); on touch they're white,
// held above the Safari toolbar (--about-vv-inset) and revealed only near the
// end of the scroll (--about-footer-shown, set in LensScene) so they land over
// the group photo at the bottom of the page.
function AboutOverlay() {
  useVisualViewportInset()
  return (
    <div className="about-overlay">
      {/* Desktop only — on phones the browser's own back gesture covers this,
          and the corner is needed for the mark. */}
      {!IS_TOUCH && (
        <Link to="/" className="about-back">
          ← back
        </Link>
      )}
      <div className="about-logo">
        <AdaptiveMark height={19.5} />
      </div>
      <div className="about-bio-lines">
        Coder to Designer
        <br />
        From Accra to Chicago to Melbourne
      </div>
      <div className="about-signoff">Designed with Love</div>
    </div>
  )
}
