// The back/scroll vocabulary — detection only, no DOM.
//
// Open palm is the universal "navigate" pose. While it is held, the two axes
// mean different things, and they never collide because the gate is which axis
// dominates the motion:
//
//   vertical drag       -> scroll     (proportional, continuous)
//   fast horizontal flick -> back      (one-shot, latched)
//
// Fist and pinch are deliberately NOT used here — fist stays a hold/brake and
// pinch stays select, so the meaning of every pose is the same on every page.
// Home is the sole exception: there the carousel repurposes open-palm-horizontal
// for spinning, so NavGestures is simply not run on home (which has no "back"
// anyway).
//
// The engine is pure — fed frames, returns intents — so the whole vocabulary is
// testable without a camera. The rAF/React glue lives in NavGestures.tsx.

import type { Pose } from './types'

/** Leftward flick = back. The first thing to A/B with a real user; flip to +1 for rightward. */
export const BACK_DIRECTION = -1
/** Net horizontal travel (normalized) a flick must cover to count as back. */
export const BACK_DISTANCE = 0.26
/** ...within this window, so a slow drift across the frame never reads as a flick. */
export const BACK_WINDOW_MS = 320
/** Horizontal travel must beat vertical travel by this factor — keeps it off the scroll axis. */
export const BACK_AXIS_RATIO = 1.5
/** Below this fraction of BACK_DISTANCE the latch clears, so one swipe fires once. */
export const BACK_RELATCH = 0.5

/** Normalized scroll units per unit of vertical hand travel. */
export const SCROLL_GAIN = 1.4
/** +1 means hand-up advances the page (down), matching a natural touch drag. */
export const SCROLL_SIGN = 1
/** Per-frame vertical travel below this is treated as jitter, not scrolling. */
export const SCROLL_DEADZONE = 0.004
/** Smoothing time constant for the scroll cursor, seconds. Decouples from inference rate. */
export const SCROLL_TAU = 0.05

export interface NavFrame {
  present: boolean
  /** The raw (ungated) pose — steering, not committing, so no stability gate. */
  pose: Pose
  x: number
  y: number
  /** Timestamp in ms. */
  t: number
}

export interface NavIntent {
  /** Fired on the frame a back swipe completes. */
  back: boolean
  /** Normalized scroll delta for this frame (0 when not scrolling). */
  scroll: number
}

const NONE: NavIntent = { back: false, scroll: 0 }

export class NavGestureEngine {
  private samples: { t: number; x: number; y: number }[] = []
  private smoothY: number | null = null
  private lastT = 0
  /** Latched after a back fires, until the hand settles — one swipe, one back. */
  private latched = false

  /** Feed one frame, get this frame's intents. */
  update(f: NavFrame): NavIntent {
    // Any non-navigate state clears everything: a back mid-flight shouldn't
    // survive the hand leaving frame or switching pose, and the scroll cursor
    // must not lerp across the gap when the hand returns elsewhere.
    if (!f.present || f.pose !== 'open_palm') {
      this.reset()
      return NONE
    }

    const dt = this.lastT ? (f.t - this.lastT) / 1000 : 0
    this.lastT = f.t

    // Rolling window for the back flick.
    this.samples.push({ t: f.t, x: f.x, y: f.y })
    while (this.samples.length > 2 && f.t - this.samples[1].t > BACK_WINDOW_MS) this.samples.shift()
    const oldest = this.samples[0]
    const winDx = f.x - oldest.x
    const winDy = f.y - oldest.y

    const back = this.detectBack(winDx, winDy)

    // Scroll cursor, smoothed to display rate so it doesn't step at the (slower)
    // inference rate. Reused from the carousel's approach.
    if (this.smoothY === null) this.smoothY = f.y
    const prevSmooth = this.smoothY
    if (dt > 0) this.smoothY += (f.y - this.smoothY) * (1 - Math.exp(-dt / SCROLL_TAU))

    const scroll = this.detectScroll(prevSmooth, winDx, winDy, back)

    return { back, scroll }
  }

  private detectBack(winDx: number, winDy: number): boolean {
    const horizontal = Math.abs(winDx)
    // Clear the latch once the hand has settled back below half the trigger
    // distance, so a held-out hand or a slow return doesn't re-fire.
    if (this.latched) {
      if (horizontal < BACK_DISTANCE * BACK_RELATCH) this.latched = false
      return false
    }
    const isFlick =
      horizontal >= BACK_DISTANCE &&
      horizontal >= BACK_AXIS_RATIO * Math.abs(winDy) &&
      Math.sign(winDx) === BACK_DIRECTION
    if (isFlick) {
      this.latched = true
      return true
    }
    return false
  }

  private detectScroll(prevSmooth: number, winDx: number, winDy: number, back: boolean): number {
    // Never scroll on the same frame a back fires, and never while the motion is
    // horizontal-dominant (that belongs to back, not scroll).
    if (back || Math.abs(winDx) > Math.abs(winDy)) return 0
    const dy = this.smoothY! - prevSmooth
    if (Math.abs(dy) < SCROLL_DEADZONE) return 0
    // hand up (y decreasing) -> positive delta -> advance the page.
    return -dy * SCROLL_GAIN * SCROLL_SIGN
  }

  private reset() {
    this.samples = []
    this.smoothY = null
    this.lastT = 0
    this.latched = false
  }
}
