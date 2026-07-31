// Visitor-facing entry into hand control.
//
// This is the piece that turns hand tracking from a thing only the developer
// can reach (behind ?hands) into something a visitor can actually opt into. It
// owns every state except the live gesture feedback: the invitation, the
// permission primer, the loading wait, the denied/error fallbacks, and the
// persistent stop control while running. The home HUD (HandCarousel) owns the
// live readout on top of this.
//
// The primer exists because of one UX rule: never let the browser's camera
// prompt be a visitor's first explanation of why a portfolio wants their
// webcam. We say what it does and that nothing leaves their device *before*
// the prompt appears, so the prompt confirms a choice they've already made.

import { useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { GESTURE_ROUTES } from './flag'
import { useHandTracking } from './useHandTracking'
import { useHandUI } from './store'
import './handControl.css'

/**
 * What each route's gestures actually do, shown before the camera prompt.
 *
 * Route-keyed because the primer is the *only* instruction a visitor gets, and
 * the gestures genuinely differ per page — someone invited on /projects being
 * told how to spin a carousel would be worse than no primer at all.
 */
const PRIMER_COPY: Record<string, ReactNode> = {
  '/projects': (
    <>
      Move your hand to aim the beam of light. <b>Pinch</b> to open the project it lands on,
      make a <b>fist</b> to hold your aim.
    </>
  ),
}

const DEFAULT_PRIMER = (
  <>
    Move an open hand to spin the carousel, <b>pinch</b> to enter, make a <b>fist</b> to hold
    still.
  </>
)

export function HandControl() {
  const { start, stop } = useHandTracking()
  const ui = useHandUI()
  const { pathname } = useLocation()
  const [primerOpen, setPrimerOpen] = useState(false)

  const onGestureRoute = GESTURE_ROUTES.has(pathname)

  // While running, the control follows the camera across every route — the
  // camera is on, so an off switch must always be within reach even on pages
  // where no gesture does anything yet (phase 3 fills those in).
  if (ui.status === 'running') {
    return (
      <button className="hand-control hand-control--stop" onClick={stop}>
        <CameraDot />
        <span>hand control on</span>
        <span className="hand-control__x" aria-hidden>
          ✕
        </span>
      </button>
    )
  }

  if (ui.status === 'loading') {
    return (
      <div className="hand-control hand-control--status">
        <Spinner />
        <span>starting camera…</span>
      </div>
    )
  }

  // denied / error / idle all live below, and only on routes where turning it
  // on would actually do something.
  if (!onGestureRoute) return null

  if (ui.status === 'denied' || ui.status === 'error') {
    const denied = ui.status === 'denied'
    return (
      <div className="hand-control hand-control--fallback">
        <p>{denied ? 'Camera access was blocked.' : ui.message || 'Hand control failed to start.'}</p>
        {denied && (
          <span className="hand-control__sub">
            Allow the camera for this site in your browser, then try again.
          </span>
        )}
        <div className="hand-control__row">
          <button className="hand-control__btn" onClick={() => start('camera')}>
            Try again
          </button>
        </div>
      </div>
    )
  }

  // idle
  if (primerOpen) {
    return (
      <div className="hand-control hand-control--primer" role="dialog" aria-label="Hand control">
        <strong>Control with your hand</strong>
        <p>{PRIMER_COPY[pathname] ?? DEFAULT_PRIMER}</p>
        <p className="hand-control__privacy">
          Uses your webcam, running entirely on your device. No video is recorded, uploaded, or
          seen by anyone — turn it off whenever you like.
        </p>
        <div className="hand-control__row">
          <button
            className="hand-control__btn hand-control__btn--primary"
            onClick={() => {
              setPrimerOpen(false)
              start('camera')
            }}
          >
            Enable camera
          </button>
          <button className="hand-control__btn" onClick={() => setPrimerOpen(false)}>
            Not now
          </button>
        </div>
      </div>
    )
  }

  return (
    <button className="hand-control hand-control--invite" onClick={() => setPrimerOpen(true)}>
      <HandIcon />
      <span>Control with your hand</span>
    </button>
  )
}

function HandIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 11V5.5a1.5 1.5 0 0 1 3 0V10m0 0V4a1.5 1.5 0 0 1 3 0v6m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.6a5 5 0 0 1-3.9-1.86L4 16.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CameraDot() {
  return <span className="hand-control__dot" aria-hidden />
}

function Spinner() {
  return <span className="hand-control__spinner" aria-hidden />
}
