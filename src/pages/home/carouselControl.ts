// Hand control for the home carousel.
//
// This is the payoff of routing every input through swipe.ts: the hand driver
// writes the same `offset` / `velocity` / `dragging` fields that
// attachMouseDrag and attachTouchDrag already write, so <Rig>, <Banner> and
// <Card> need no knowledge of it. The scene's inertia, its banner wave speed
// and its click suppression all keep working for free.
//
// The gesture design, which differs from the first sketch:
//
//   open hand, move sideways  ->  spin the carousel
//   fist                      ->  clutch: hold position without spinning
//   pinch                     ->  enter whichever card is facing you
//
// Selection is by *rotation*, not by pointing. On a carousel the front-facing
// card is unambiguous and reachable by the same motion used to browse, so
// there's nothing to aim at — pinch just takes the card you already turned to.
// Aiming a jittery cursor at a moving, foreshortened card would be much worse.

import { CARDS } from './cardData'
import { currentTurns, swipe } from './swipe'
import { hand } from '../../gestures/store'

/**
 * Revolutions per unit of normalized hand travel.
 *
 * A full sweep across the camera frame turns 1.1 revolutions — five and a half
 * cards — so a comfortable arm movement covers three or four. Raised from 0.8
 * because the usable span is much narrower than the frame: tracking is lost
 * well before the edge, so reaching the far side of the carousel in one motion
 * meant running out of camera first.
 *
 * This is the main feel knob. Lower it for finer control, raise it for reach.
 */
const TURNS_PER_UNIT = 1.1

/** Matches the touch handler's cap, so a hand flick coasts like a finger flick. */
const MAX_VELOCITY = 0.6

/**
 * Hand travel below this (normalized units per second) is treated as holding
 * still. The One-Euro filter removes most jitter, but not all, and a carousel
 * that creeps while your hand rests reads as broken.
 */
const DEADZONE = 0.02

/**
 * Time constant for smoothing hand position up to display rate.
 *
 * Inference runs at 12-22Hz while the scene renders at 60, so reading hand.x
 * directly would step the rotation at the inference rate — clearly visible as
 * judder on a large rotating object. This interpolates across roughly one
 * inference interval, which costs no more lag than we already have.
 */
const SMOOTHING_TAU = 0.045

/** Poses that spin. Fist is deliberately excluded so it acts as a clutch. */
const SPIN_POSES = new Set(['open_palm', 'point'])

/**
 * Which card is facing the viewer at a given rotation.
 *
 * <Carousel> places card i at angle (i / count) * 2pi and <Rig> rotates the
 * whole group by `turns` revolutions, so card i faces the camera when
 * i / count + turns is a whole number — hence rounding -turns * count.
 */
export function frontCardIndex(turns: number, count: number = CARDS.length): number {
  return ((Math.round(-turns * count) % count) + count) % count
}

export interface HandCarouselCallbacks {
  /** Called once per pinch, with the card that was facing the viewer. */
  onSelect: (route: string) => void
}

/**
 * Start driving the carousel from hand state. Returns a stop function.
 *
 * Runs its own rAF loop rather than a useFrame inside the Canvas, so the whole
 * feature stays outside the scene graph and can be lifted out in one piece.
 */
export function attachHandCarousel({ onSelect }: HandCarouselCallbacks): () => void {
  let raf = 0
  let lastTime = 0
  /** Hand x, interpolated to display rate. null until the first sample. */
  let smoothX: number | null = null
  let prevSmoothX = 0
  /** True while we are the one holding swipe.dragging, so we only clear our own. */
  let holdingDrag = false
  /** Latches on pinch commit so one pinch fires one navigation. */
  let pinchFired = false

  const release = () => {
    if (holdingDrag) {
      // Handing back to <Rig>'s inertia: it applies swipe.velocity once
      // dragging goes false, which is what makes a hand flick coast.
      swipe.dragging = false
      holdingDrag = false
    }
    smoothX = null
  }

  const tick = (time: number) => {
    raf = requestAnimationFrame(tick)
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.1) : 0
    lastTime = time

    if (!hand.present) {
      release()
      pinchFired = false
      return
    }

    // Select off the *committed* pose — this navigates, so it must be gated.
    if (hand.pose === 'pinch') {
      if (!pinchFired) {
        pinchFired = true
        release()
        onSelect(CARDS[frontCardIndex(currentTurns())].route)
      }
      return
    }
    pinchFired = false

    // Spin off the *raw* pose. It steers rather than commits, so the stability
    // gate would only add lag: a spurious frame nudges the rotation by a hair
    // and the next frame corrects it, which nobody can perceive.
    if (!SPIN_POSES.has(hand.rawPose)) {
      release()
      return
    }

    if (smoothX === null) {
      // First frame of a new gesture: adopt the current position rather than
      // interpolating from wherever the hand was last seen, which would spin
      // the carousel by the whole gap.
      smoothX = hand.x
      prevSmoothX = hand.x
    } else if (dt > 0) {
      smoothX += (hand.x - smoothX) * (1 - Math.exp(-dt / SMOOTHING_TAU))
    }

    swipe.dragging = true
    holdingDrag = true

    const dx = smoothX - prevSmoothX
    prevSmoothX = smoothX
    if (dt > 0) {
      const speed = dx / dt
      if (Math.abs(speed) > DEADZONE) {
        swipe.offset += dx * TURNS_PER_UNIT
        swipe.velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, speed * TURNS_PER_UNIT))
      } else {
        // Resting: bleed off any stored velocity so releasing from a standstill
        // doesn't launch the carousel with a stale flick.
        swipe.velocity = 0
      }
    }
  }

  raf = requestAnimationFrame(tick)
  return () => {
    cancelAnimationFrame(raf)
    release()
    swipe.velocity = 0
  }
}
