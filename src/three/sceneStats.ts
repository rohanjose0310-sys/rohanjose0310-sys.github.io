// Live scene render stats, published out of the Canvas.
//
// A plain mutable object, read in rAF loops — same pattern and reasoning as
// gestures/store.ts's `hand`: this updates every frame and must never trigger a
// React render.
//
// It exists so the effect of the hand-mode dpr backoff is *observable*. The
// preview browser freezes R3F's frameloop, so scene framerate can't be measured
// there; surfacing it in the calibration panel lets it be verified on a real
// machine instead of taken on faith.

export const sceneStats = {
  /** Rendered frames in the last second. */
  fps: 0,
  /** The device pixel ratio currently in effect. */
  dpr: 0,
  /** True while the dpr backoff is applied (hand tracking on a GPU-heavy page). */
  backedOff: false,
}
