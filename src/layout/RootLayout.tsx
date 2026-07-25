import { Suspense, lazy, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Leva } from 'leva'
import { DEBUG } from '../lib/debug'
import { useLenis } from '../lib/lenis'
import { Logo } from '../components/ui/Logo'
import { BarTint } from '../components/ui/BarTint'
import { applyPageTheme } from '../lib/pageTheme'
import { HANDS_DEBUG, HANDS_SUPPORTED } from '../gestures/flag'

// Both lazy, so the gesture UI and its CSS stay out of the main bundle. The
// heavy parts (MediaPipe wasm + the 7.8MB model) are further down still — they
// only load when the visitor actually starts tracking.
const HandControl = lazy(() =>
  import('../gestures/HandControl').then((m) => ({ default: m.HandControl })),
)
const HandOverlay = lazy(() =>
  import('../gestures/HandOverlay').then((m) => ({ default: m.HandOverlay })),
)

// Persistent app chrome: one Lenis smooth-scroll instance for the whole app;
// pages render through <Outlet/>. Lenis is disabled on routes that scroll via
// drei ScrollControls (home carousel, about lens), which Lenis would block.
const SCROLLCONTROLS_ROUTES = ['/', '/about']

export function RootLayout() {
  const { pathname } = useLocation()
  useLenis(!SCROLLCONTROLS_ROUTES.includes(pathname))
  // Keeps <body> and color-scheme on the current route. This does NOT re-tint
  // Safari's bars — it ignores post-first-paint changes to body — so it only
  // has to be right for what the page itself paints; <BarTint> handles the bars.
  useEffect(() => {
    applyPageTheme(pathname)
  }, [pathname])
  return (
    <>
      <Leva hidden={!DEBUG} collapsed />
      <BarTint />
      <Logo />
      <Outlet />
      {HANDS_SUPPORTED && (
        <Suspense fallback={null}>
          {/* Visitor opt-in: the invitation, primer, and stop control. */}
          <HandControl />
          {/* Developer calibration panel, on top, dev/?hands only. */}
          {HANDS_DEBUG && <HandOverlay />}
        </Suspense>
      )}
    </>
  )
}
