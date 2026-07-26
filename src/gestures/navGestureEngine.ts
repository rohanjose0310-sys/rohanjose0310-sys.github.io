// The scroll gesture — detection only, no DOM.
//
// Open palm, dragged vertically, scrolls. That's all this engine does now: back
// used to be an open-palm horizontal flick here, but a directional swipe proved
// unreliable to trigger, so back became a distinct static pose ("three") handled
// in NavGestures.tsx. Keeping scroll on open palm and back on its own pose means
// the two can never be confused, and there's no axis to get wrong.
//
// The horizontal axis is still watched, but only to *suppress* scroll: a
// sideways open-palm sweep (which no longer means anything) must not scroll.
//
// The engine is pure — fed frames, returns a scroll delta — so it's testable
// without a camera. The rAF/React glue lives in NavGestures.tsx.

import type { Pose } from './types'

/** Normalized scroll units per unit of vertical hand travel. */
export const SCROLL_GAIN = 1.4
/** +1 means hand-up advances the page (down), matching a natural touch drag. */
export const SCROLL_SIGN = 1
/** Per-frame vertical travel below this is treated as jitter, not scrolling. */
export const SCROLL_DEADZONE = 0.004
/** Smoothing time constant for the scroll cursor, seconds. Decouples from inference rate. */
export const SCROLL_TAU = 0.05
/** Window over which motion axis (vertical vs horizontal) is judged. */
export const AXIS_WINDOW_MS = 200

export interface NavFrame {
  present: boolean
  /** The raw (ungated) pose — steering, not committing, so no stability gate. */
  pose: Pose
  x: number
  y: number
  /** Timestamp in ms. */
  t: number
}

export class NavGestureEngine {
  private samples: { t: number; x: number; y: number }[] = []
  private smoothY: number | null = null
  private lastT = 0

  /** Feed one frame, get this frame's normalized scroll delta (0 when not scrolling). */
  update(f: NavFrame): number {
    // Only open palm scrolls. Any other pose (including the back pose) or the
    // hand leaving frame clears the cursor, so it never lerps across the gap
    // when the hand returns elsewhere.
    if (!f.present || f.pose !== 'open_palm') {
      this.reset()
      return 0
    }

    const dt = this.lastT ? (f.t - this.lastT) / 1000 : 0
    this.lastT = f.t

    // Short window to judge which axis the motion is on.
    this.samples.push({ t: f.t, x: f.x, y: f.y })
    while (this.samples.length > 2 && f.t - this.samples[1].t > AXIS_WINDOW_MS) this.samples.shift()
    const oldest = this.samples[0]
    const winDx = f.x - oldest.x
    const winDy = f.y - oldest.y

    // Scroll cursor, smoothed to display rate so it doesn't step at the (slower)
    // inference rate. Same approach as the carousel.
    if (this.smoothY === null) this.smoothY = f.y
    const prevSmooth = this.smoothY
    if (dt > 0) this.smoothY += (f.y - this.smoothY) * (1 - Math.exp(-dt / SCROLL_TAU))

    // Horizontal-dominant motion isn't a scroll — suppress it.
    if (Math.abs(winDx) > Math.abs(winDy)) return 0
    const dy = this.smoothY - prevSmooth
    if (Math.abs(dy) < SCROLL_DEADZONE) return 0
    // hand up (y decreasing) -> positive delta -> advance the page.
    return -dy * SCROLL_GAIN * SCROLL_SIGN
  }

  private reset() {
    this.samples = []
    this.smoothY = null
    this.lastT = 0
  }
}
