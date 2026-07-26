// 21 landmarks -> a pose, in plain trigonometry.
//
// This replaces MediaPipe's `gesture_recognizer.task`, which bundles a canned
// classifier for 8 fixed poses we didn't choose and costs 550KB more than the
// bare `hand_landmarker.task`. Doing the classification here is smaller, gives
// us gestures we designed, and makes every threshold tunable at runtime
// (see tuning.ts / the Leva panel) instead of baked into a model file.
//
// Everything is normalized by hand span, so it behaves the same whether the
// hand is near the camera or far from it.

import { LM, type Landmark, type Pose } from './types'

/** Per-finger extension, 0 = fully curled, 1 = fully straight. */
export interface FingerCurls {
  thumb: number
  index: number
  middle: number
  ring: number
  pinky: number
}

export interface PoseAnalysis {
  pose: Pose
  curls: FingerCurls
  /** Thumb-tip to index-tip distance, normalized by hand span. */
  pinchDistance: number
  /** Thumb-tip to index-MCP distance, normalized by span. Low = tucked across the palm. */
  thumbSpread: number
  /** Wrist to middle-MCP distance in normalized frame units — our depth proxy. */
  span: number
}

export interface Thresholds {
  /**
   * The single extended/curled boundary: a finger reading at or above this is
   * extended, below it is curled.
   *
   * One threshold, not an extended/curled pair with a gap between them. The gap
   * was a trap: the extension metric puts a finger curled to ~90° at each joint
   * near 0.5, which fell into a 0.42–0.72 dead zone and read as *neither*, so
   * every pose that needs a curled finger (fist, point, three) silently failed
   * on a real hand while open-palm and pinch still worked.
   */
  fingerSplit: number
  /** Pinch engages below this (normalized by span). */
  pinchOn: number
  /** ...and only releases above this. The gap is the hysteresis band. */
  pinchOff: number
  /**
   * Minimum average extension of middle/ring/pinky for a pinch to count.
   *
   * A pinch is thumb-to-index with the hand otherwise open. Without this, a
   * half-closed fist — which every open-to-fist transition passes through, with
   * the thumb already coming across — satisfies the distance test and fires a
   * navigation.
   */
  pinchOpen: number
  /**
   * Thumb-tip-to-index-MCP distance (span-normalized) below which the thumb
   * counts as tucked across the palm.
   *
   * This is what separates a peace sign (thumb tucked — goes back) from a three
   * (thumb up — does nothing). Deliberately a *distance* rather than the thumb's
   * joint-angle extension: tucking the thumb is mostly adduction across the palm
   * rather than bending, so the distance carries far more signal. Measured on
   * the synthetic hand, distance separates the two shapes by ~64x the noise
   * versus ~26x for joint angles.
   */
  thumbTucked: number
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  // Midway between a realistically curled finger (~0.5) and a comfortably
  // extended one (~0.9), so both land clearly on their own side with margin.
  // Retune live from the calibration panel if a hand or camera sits differently.
  fingerSplit: 0.65,
  // Tuned against a span-normalized distance: with fingers touching this lands
  // near 0.25, and a comfortably open hand sits well above 0.7. The 0.10 gap
  // between on and off is what stops a hand hovering at the boundary from
  // machine-gunning select/deselect.
  pinchOn: 0.38,
  pinchOff: 0.48,
  // Swept against simulated fist-closing motions at 12/15/22Hz, at three
  // speeds and four thumb-lead ratios (with the realistic ~0.5 curl): below
  // 0.75 some closes commit a spurious pinch (a spurious navigation), and above
  // ~0.78 a relaxed pinch stops registering. 0.75 clears every misfire with a
  // margin before deliberate pinches are lost.
  pinchOpen: 0.75,
  // Midway between a tucked thumb (~0.12) and one held up (~0.79). Every other
  // pose sits clearly on one side: fist 0.07 tucked, open palm / point / pinch
  // ~0.79-0.88 up.
  thumbTucked: 0.45,
}

function dist(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/**
 * Extension of one finger, from the angle at its two joints.
 *
 * Angle-based rather than the tempting distance-from-wrist test: a fist held
 * toward the camera foreshortens badly, so tip-to-wrist distance reads as
 * "curled" for a perfectly straight finger pointing at the lens. Joint angles
 * are invariant to that.
 */
function fingerExtension(lms: Landmark[], mcp: number, pip: number, dip: number, tip: number): number {
  const a = jointAngle(lms[mcp], lms[pip], lms[dip])
  const b = jointAngle(lms[pip], lms[dip], lms[tip])
  // Each joint contributes up to 180 degrees of bend; average them and map
  // straight (pi) -> 1, folded back (0) -> 0.
  return Math.min(1, Math.max(0, (a + b) / 2 / Math.PI))
}

/** Interior angle at `b` in the a-b-c chain, in radians (0 = folded back, pi = straight). */
function jointAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const abx = a.x - b.x
  const aby = a.y - b.y
  const cbx = c.x - b.x
  const cby = c.y - b.y
  const dot = abx * cbx + aby * cby
  const mag = Math.hypot(abx, aby) * Math.hypot(cbx, cby)
  if (mag === 0) return Math.PI
  return Math.acos(Math.min(1, Math.max(-1, dot / mag)))
}

/**
 * Classify a single frame. Stateless by design — hysteresis and stability live
 * in the tracker (see tracker.ts), so this stays trivially testable.
 *
 * @param wasPinching lets pinch use its release threshold instead of its engage
 *   threshold, which is the whole point of the hysteresis pair.
 */
export function classify(
  lms: Landmark[],
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
  wasPinching = false,
): PoseAnalysis {
  // Wrist -> middle MCP is the most stable segment on the hand: it barely moves
  // relative to finger articulation, so it makes a good scale reference.
  const span = dist(lms[LM.WRIST], lms[LM.MIDDLE_MCP]) || 1e-6

  const curls: FingerCurls = {
    // The thumb's MCP barely bends, so include the CMC to get usable range.
    thumb: fingerExtension(lms, LM.THUMB_CMC, LM.THUMB_MCP, LM.THUMB_IP, LM.THUMB_TIP),
    index: fingerExtension(lms, LM.INDEX_MCP, LM.INDEX_PIP, LM.INDEX_DIP, LM.INDEX_TIP),
    middle: fingerExtension(lms, LM.MIDDLE_MCP, LM.MIDDLE_PIP, LM.MIDDLE_DIP, LM.MIDDLE_TIP),
    ring: fingerExtension(lms, LM.RING_MCP, LM.RING_PIP, LM.RING_DIP, LM.RING_TIP),
    pinky: fingerExtension(lms, LM.PINKY_MCP, LM.PINKY_PIP, LM.PINKY_DIP, LM.PINKY_TIP),
  }

  const pinchDistance = dist(lms[LM.THUMB_TIP], lms[LM.INDEX_TIP]) / span
  const thumbSpread = dist(lms[LM.THUMB_TIP], lms[LM.INDEX_MCP]) / span
  const ext = (v: number) => v >= thresholds.fingerSplit
  const cur = (v: number) => v < thresholds.fingerSplit

  return { pose: pick(), curls, pinchDistance, thumbSpread, span }

  function pick(): Pose {
    const fingers = [curls.index, curls.middle, curls.ring, curls.pinky]

    // Fist is tested before pinch, and this ordering is the whole trick.
    //
    // A real fist tucks the thumb across the curled fingers, which parks the
    // thumb tip right next to the index tip — so `pinchDistance` collapses and
    // a pinch-first test swallows every fist. Testing "all four fingers curled"
    // first is unambiguous in the other direction: a pinch is index-to-thumb
    // with the hand otherwise open, so its middle, ring and pinky stay
    // extended and it can never satisfy this.
    //
    // The thumb is left out of the test on purpose — tucked across the fingers
    // its joint angles read as half-extended, so requiring a curled thumb would
    // reject most real fists.
    if (fingers.every(cur)) return 'fist'

    // Pinch wins over everything that remains. It is the only committing
    // gesture, so an ambiguous frame should resolve to pinch — a missed select
    // is far more annoying than a missed spin, which the next frame just picks
    // up again.
    //
    // The openness test is what keeps a *partly* closed fist out: the fully
    // closed case is caught above, but the fingers pass through the middle of
    // their range on the way there, with the thumb already travelling.
    const openness = (curls.middle + curls.ring + curls.pinky) / 3
    if (
      openness >= thresholds.pinchOpen &&
      pinchDistance < (wasPinching ? thresholds.pinchOff : thresholds.pinchOn)
    ) {
      return 'pinch'
    }

    if (fingers.every(ext)) return 'open_palm'
    if (ext(curls.index) && cur(curls.middle) && cur(curls.ring) && cur(curls.pinky)) return 'point'
    // Two fingers up, ring and pinky curled. The thumb then decides which of the
    // two poses it is, and only 'peace' means back:
    //
    //   thumb tucked across the palm -> 'peace'  (the back gesture)
    //   thumb held up / out          -> 'three'  (deliberately inert)
    //
    // Splitting them matters because both shapes are easy to make by accident
    // when the other is intended; keeping 'three' as its own pose (rather than
    // folding it into 'none') also lets the calibration panel show which one a
    // hand is actually making.
    //
    // Both are disjoint from everything above: fist/open_palm differ on the
    // extended set, point has the middle curled, and pinch is ruled out by its
    // openness gate with ring and pinky curled.
    if (ext(curls.index) && ext(curls.middle) && cur(curls.ring) && cur(curls.pinky)) {
      return thumbSpread < thresholds.thumbTucked ? 'peace' : 'three'
    }
    return 'none'
  }
}
