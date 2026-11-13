// Hand control for the prism scene on /projects.
//
// Same shape as pages/home/carouselControl.ts: an rAF loop living outside the
// Canvas, writing into a small shared store, returning a stop function. The
// scene reads that store in exactly one place (PrismScene's setRay) and
// otherwise knows nothing about hands.
//
// The gesture design:
//
//   move your hand  ->  move the cursor, and the beam with it
//   fist            ->  clutch: hold the aim while you recentre your arm
//   pinch           ->  open whatever the beam has landed on
//
// Selection is by *aiming*, unlike the home carousel where it is by rotation.
// The difference is that here there genuinely is something to aim at — three
// diamonds at fixed points — and the beam is already the page's whole idiom,
// so pointing is the honest mapping rather than a jittery approximation of one.

import { aim, setAimSource } from './aim'
import { claimHover, focus } from './focus'
import { hand } from '../../gestures/store'

/**
 * Screen travel per unit of normalized hand travel.
 *
 * This one has to be derived rather than felt, because the page has a hard
 * reachability requirement. The beam runs cursor -> world origin, so to light a
 * diamond the cursor must sit *beyond* it on the ray from the origin through
 * it. The lowest diamond is dream-parasite at world (2.25, -3.5), |d| = 4.16 (the
 * outer Tratto and Interference diamonds sit near y = -1, well inside ndcY);
 * clearing its hitbox (a unit box under scale={0.5}, rotated 45°, so a
 * half-diagonal of ~0.354) needs t >= 1.085, and at t = 1.1 the cursor sits at
 * world (2.48, -3.85).
 *
 * FitZoom pins zoom at 60 on any window wider than 720px, so viewport.height
 * is height/60 — on a 700px-tall window (a laptop with browser chrome, the
 * realistic worst case) that is 11.67 world units, half-height 5.83. So the
 * cursor must reach ndcY = -3.85 / 5.83 = -0.66. Solving -0.66 = (0.5 - y) * 2 * GAIN:
 *
 *   GAIN 1.0 -> hand.y 0.83, at the very bottom of the camera frame where the
 *               landmarker drops the hand entirely. This is the same failure
 *               carouselControl.ts documents for TURNS_PER_UNIT.
 *   GAIN 1.5 -> hand.y 0.72, comfortably inside the reliable band.
 *   GAIN 2.0 -> hand.y 0.61, but the whole screen then compresses into
 *               hand ∈ [0.33, 0.67] and residual jitter is amplified 2x onto a
 *               ~30px target.
 *
 * 1.5 is the smallest gain that reaches every diamond on a short window. One
 * gain rather than separate X/Y: the camera frame is landscape, so the same
 * physical movement already yields a larger normalized delta vertically, which
 * pre-compensates in exactly the direction the diamonds (all low, all near
 * centre horizontally) need.
 *
 * This is the main feel knob.
 */
const GAIN = 1.5

/**
 * Time constant for smoothing hand position up to display rate.
 *
 * Inference runs at 12-22Hz against a 60Hz render, so reading hand.x/y raw
 * steps the beam at the inference rate — visible as judder on a long beam.
 * carouselControl uses 0.045 (about one inference interval); a reticle aimed at
 * a small target needs more jitter rejection than a large rotating carousel,
 * and stays under the ~100ms where pointing starts to feel detached from the
 * hand. 0.07 is roughly 1.5 inference intervals.
 */
const TAU = 0.07

/**
 * Movement needed for the hand to take the aim back from the mouse.
 *
 * A real pointermove takes it away instantly — that is unambiguous. Handing it
 * back needs a threshold, or residual jitter would yank the aim away from
 * someone who is actually using the mouse. Matches carouselControl's DEADZONE,
 * chosen against the same noise floor.
 */
const TAKEOVER = 0.02

/**
 * How far clutching may shift the hand->screen mapping.
 *
 * NDC spans 2 units edge to edge, so a single clutch can legitimately need an
 * offset approaching 2 — clutching at one edge and resuming at the other is the
 * whole point. Clamping this to 1 (the NDC bound) silently truncates exactly
 * the large clutch that matters, dropping the beam short of where it was held.
 * The bound only exists so repeated clutching in one direction can't push the
 * mapping so far that part of the screen becomes unreachable.
 */
const MAX_OFFSET = 2

/** Deliberately no deadzone on position: see the note at the smoothing step. */

const clamp = (v: number, limit = 1) => (v < -limit ? -limit : v > limit ? limit : v)

export interface HandAimCallbacks {
  /** Called once per committed pinch, with the project the beam was on. */
  onSelect: (projectId: string) => void
}

/** Start driving the beam from hand state. Returns a stop function. */
export function attachHandAim({ onSelect }: HandAimCallbacks): () => void {
  let raf = 0
  let lastTime = 0

  /** Smoothed aim. `adopted` false means: snap on the next sample, don't lerp. */
  let sx = 0
  let sy = 0
  let adopted = false

  /** Clutch offset — see the fist branch. */
  let offsetX = 0
  let offsetY = 0
  let clutching = false

  /** Last raw target, for the takeover test. */
  let lastRawX: number | null = null
  let lastRawY = 0

  /** Pinch state: the latched target, the edge, and the one-shot fire. */
  let latched: string | null = null
  let wasPinching = false
  let pinchFired = false

  const resetGesture = () => {
    adopted = false
    offsetX = 0
    offsetY = 0
    clutching = false
    latched = null
    wasPinching = false
    pinchFired = false
    aim.progress = 0
  }

  // A real pointer move is discrete and unambiguous, so it takes the aim back
  // immediately — no threshold, no delay. Also drops the hover claim, because
  // ownership of hoverClaim follows ownership of the aim (see HandCursor).
  const onPointerMove = () => {
    if (aim.source !== 'hand') return
    setAimSource('mouse')
    claimHover(null)
    resetGesture()
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true })

  const tick = (time: number) => {
    raf = requestAnimationFrame(tick)
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.1) : 0
    lastTime = time

    if (!hand.present) {
      // Freeze rather than snap back. A hand that briefly leaves frame should
      // not fling the beam to wherever the physical mouse happens to be
      // resting — moving the mouse is what hands control back, and the
      // listener above already does exactly that.
      aim.live = false
      lastRawX = null
      resetGesture()
      return
    }
    aim.live = true

    // hand.y runs DOWN the camera frame (MediaPipe convention, gestures/types.ts)
    // while NDC y runs UP, hence the flip on that axis only. hand.x is already
    // un-mirrored by the tracker.
    const rawX = (hand.x - 0.5) * 2 * GAIN
    const rawY = (0.5 - hand.y) * 2 * GAIN

    // Take the aim back from the mouse only on deliberate movement.
    if (aim.source !== 'hand') {
      const moved = lastRawX !== null && Math.hypot(rawX - lastRawX, rawY - lastRawY) > TAKEOVER
      lastRawX = rawX
      lastRawY = rawY
      if (!moved) return
      setAimSource('hand')
      // Adopt on the frame we take over, rather than sweeping in from
      // wherever the hand was last seen.
      adopted = false
      offsetX = 0
      offsetY = 0
    }
    lastRawX = rawX
    lastRawY = rawY

    // --- Pinch: latch, freeze, commit ---
    //
    // The latch is correctness. resolveFocus() is live and deliberately not
    // latched (see focus.ts), and Reflect's MISS_TOLERANCE means beam claims
    // lag reality by 3 frames — so between that and the ~90ms pinch stability
    // gate, focus.id at commit time can genuinely be a *different* project
    // than the one you were pointing at when you started closing your fingers.
    //
    // The freeze is the feedback. Without it the latch is invisible; with it
    // the beam visibly locks onto the diamond the instant the pinch starts,
    // and the reticle's collapse reads as "this one, confirming". It costs a
    // ~50ms stall on a single misclassified frame, which is self-correcting.
    const pinching = hand.rawPose === 'pinch'
    if (pinching && !wasPinching) latched = focus.id
    wasPinching = pinching

    if (pinching) {
      // A committed pinch reads as 100% even once poseProgress has moved on to
      // the next pose, so the reticle never springs back at the moment it
      // fires — same trick as the home HUD's pinch bar.
      aim.progress = hand.pose === 'pinch' ? 1 : hand.poseProgress
      // Commit off the *committed* pose: this navigates, so it must be gated.
      if (hand.pose === 'pinch' && !pinchFired) {
        pinchFired = true
        // May be null — a pinch at empty space. Still latch the attempt, so one
        // hold is one try rather than a retry every frame.
        if (latched) onSelect(latched)
      }
      return
    }
    latched = null
    pinchFired = false
    aim.progress = 0

    // --- Fist: the clutch ---
    //
    // Holds the beam still so you can bring your arm back to centre, the same
    // role fist plays on the home carousel. It matters more here: reaching the
    // lower diamonds pushes your hand toward the edge of the camera frame
    // where tracking degrades, so without a way to re-centre, the far corners
    // are a one-shot reach. classify.ts tests fist before pinch and the two are
    // mutually exclusive (a fist curls every finger; a pinch requires
    // middle/ring/pinky extended), so this can never swallow a pinch.
    if (hand.rawPose === 'fist') {
      clutching = true
      return
    }
    if (clutching) {
      // Re-anchor on release: the hand moved while the beam stood still, so
      // absorb that difference into the offset. This is what makes the fist a
      // mouse-lift rather than a mere pause — reach, clutch, bring your arm
      // back, carry on from where the beam already was.
      offsetX = clamp(sx - rawX, MAX_OFFSET)
      offsetY = clamp(sy - rawY, MAX_OFFSET)
      clutching = false
    }

    const targetX = clamp(rawX + offsetX)
    const targetY = clamp(rawY + offsetY)

    // Clamp the target, not the smoothed output: otherwise the filter winds up
    // past the edge and takes ~100ms to unwind when you come back, so the beam
    // ignores you for a moment after every overreach.
    //
    // No deadzone. carouselControl needs one because it integrates velocity;
    // this is an absolute position mapping, where a deadzone would be a dead
    // patch in the middle of the screen. TAU alone handles the jitter.
    if (!adopted) {
      // First sample of a new gesture: adopt rather than interpolate. A hand
      // that leaves frame on the left and returns on the right would otherwise
      // sweep the beam across every diamond in between, claiming each one.
      sx = targetX
      sy = targetY
      adopted = true
    } else if (dt > 0) {
      const a = 1 - Math.exp(-dt / TAU)
      sx += (targetX - sx) * a
      sy += (targetY - sy) * a
    }
    aim.x = sx
    aim.y = sy
  }

  raf = requestAnimationFrame(tick)
  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('pointermove', onPointerMove)
    claimHover(null)
    setAimSource('mouse')
    aim.live = false
    aim.progress = 0
  }
}
