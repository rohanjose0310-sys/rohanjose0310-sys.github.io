import { DEBUG } from '../lib/debug'
import { IS_TOUCH } from '../lib/touch'

// Two separate questions, deliberately not conflated:
//
//   HANDS_SUPPORTED — can this visitor use hand control at all? Gates the
//     visitor-facing opt-in and the carousel controller.
//   HANDS_DEBUG — should the developer calibration panel show? Gates only that.
//
// In a normal `pnpm dev` both are true. In production only HANDS_SUPPORTED is,
// so real visitors get the opt-in button but never the debug panel.

const hasWindow = typeof window !== 'undefined'

/**
 * Whether the device can meaningfully run hand tracking.
 *
 * Touch is excluded outright: a front camera plus an ~11MB cold download plus
 * this site's transmission materials will thermally throttle a phone in under a
 * minute, and none of the gestures are designed for a hand holding the device.
 * getUserMedia also requires a secure context, so http (non-localhost) can't
 * offer it — better to hide the button than to show one that always fails.
 */
export const HANDS_SUPPORTED =
  hasWindow &&
  !IS_TOUCH &&
  window.isSecureContext &&
  typeof navigator !== 'undefined' &&
  !!navigator.mediaDevices?.getUserMedia

/**
 * The developer calibration panel. `?hands` forces it on anywhere, which is how
 * we exercise a deployed build on a real machine without shipping the panel to
 * visitors.
 */
export const HANDS_DEBUG =
  HANDS_SUPPORTED && (DEBUG || new URLSearchParams(window.location.search).has('hands'))

/**
 * Routes where the opt-in invite is offered — the pages with a rich hand
 * interaction worth advertising (home's carousel, about's scroll). Back works
 * on every non-home page once tracking is running (see NavGestures), but a
 * static page isn't worth an invite of its own.
 */
export const GESTURE_ROUTES = new Set(['/', '/about'])
