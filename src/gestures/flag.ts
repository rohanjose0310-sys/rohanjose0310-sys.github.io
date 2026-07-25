import { DEBUG } from '../lib/debug'
import { IS_TOUCH } from '../lib/touch'

// Phase 1 is plumbing, so the panel is dev-only by default. `?hands` turns it
// on anywhere, which is how we test the deployed build on a real machine
// without shipping it to visitors.
//
// Touch is excluded outright: a front camera plus an ~11MB cold download plus
// this site's transmission materials will thermally throttle a phone in under a
// minute, and none of the gestures are designed for a hand holding the device.
export const HANDS_ENABLED =
  !IS_TOUCH &&
  typeof window !== 'undefined' &&
  (DEBUG || new URLSearchParams(window.location.search).has('hands'))
