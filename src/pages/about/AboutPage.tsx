import { Link } from 'react-router-dom'
import { Preload, Scroll, ScrollControls } from '@react-three/drei'
import { SceneCanvasLayout } from '../../layout/SceneCanvasLayout'
import { Images, Lens, Typography } from './LensScene'
import { IS_TOUCH } from '../../lib/touch'
import { TouchScrollGroup, TouchScrollProvider } from './touchScroll'
import './about.css'

const BIO_COPY =
  "Years in code, a short detour through startup life, then design - because that's where the " +
  'future gets drawn first. Now I build technology, wearable or not, hoping some of it helps us ' +
  'reach further out.'

const PAGES = 3

// pmndrs "scrollcontrols-and-lens-refraction" layout: three scroll pages of
// images + typography, viewed through a pointer-tracked refractive lens.
// Copy text and images are demo placeholders (replaced with real content later).
//
// Touch devices don't use drei's <ScrollControls> at all: it traps every
// scroll gesture in its own internal overflow div, so the real <body> never
// moves — and iOS Safari only bleeds its translucent bottom bar over content
// once the document itself has genuinely scrolled (confirmed by comparison
// with the Contact page, which uses plain document flow and bleeds
// correctly). Instead, touch renders a real scrollable spacer and drives the
// same offset/position math off actual document scroll (see touchScroll.tsx).
// Desktop is untouched — same ScrollControls/Scroll as before.
export function AboutPage() {
  const content = (
    <Lens glassText={IS_TOUCH ? BIO_COPY : undefined}>
      {IS_TOUCH ? (
        <TouchScrollGroup>
          <Typography />
          <Images />
        </TouchScrollGroup>
      ) : (
        <>
          <Scroll>
            <Typography />
            <Images />
          </Scroll>
          {/* Desktop: bio scrolls in as an HTML overlay. On touch the same
              copy rides the fixed 3D glass card instead (see Lens). */}
          <Scroll html>
            <div className="about-copy">{BIO_COPY}</div>
          </Scroll>
        </>
      )}
      {/** This is a helper that pre-emptively makes threejs aware of all geometries, textures etc
           By default threejs will only process objects if they are "seen" by the camera leading
           to jank as you scroll down. With <Preload> that's solved.  */}
      <Preload />
    </Lens>
  )
  return (
    <>
      <SceneCanvasLayout
        camera={{ position: [0, 0, 20], fov: 15 }}
        backdrop="#d8d7d7"
        // Two transmission materials (lens + glass card) are GPU-heavy; cap the
        // pixel ratio on phones so it stays smooth. Desktop keeps full clarity.
        dpr={IS_TOUCH ? [1, 1.5] : [1, 2]}
      >
        {IS_TOUCH ? (
          <TouchScrollProvider pages={PAGES}>{content}</TouchScrollProvider>
        ) : (
          <ScrollControls damping={0.2} pages={PAGES} distance={0.5}>
            {content}
          </ScrollControls>
        )}
      </SceneCanvasLayout>
      {/* Real scroll runway (touch only) — invisible, sits behind the fixed
          canvas, exists purely so the document has something to scroll. */}
      {IS_TOUCH && <div aria-hidden style={{ height: '250dvh' }} />}
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
