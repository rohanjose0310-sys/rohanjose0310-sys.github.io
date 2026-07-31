import { IS_TOUCH } from '../lib/touch'

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
 * Routes where the opt-in invite is offered — the pages with a rich hand
 * interaction worth advertising (home's carousel, about's scroll, projects'
 * beam aiming). Back works on every non-home page once tracking is running
 * (see NavGestures), but a static page isn't worth an invite of its own.
 */
export const GESTURE_ROUTES = new Set(['/', '/about', '/projects'])
