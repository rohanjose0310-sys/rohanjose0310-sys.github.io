// Hand-tracking state, split in two on purpose.
//
// `hand` is a plain mutable object read every frame — same pattern as
// pages/home/swipe.ts, and for the same reason: 21 landmarks changing 20+ times
// a second inside a valtio proxy would fire a re-render storm and defeat the
// point of doing any of this smoothly.
//
// `handUI` is the valtio proxy, and only carries state React genuinely needs to
// re-render on: status, whether a hand is present, and the debounced pose.

import { proxy } from 'valtio'
import { useProxy } from 'valtio/utils'
import { DEBUG } from '../lib/debug'
import { DEFAULT_RUNTIME_SETTINGS, type RuntimeSettings } from './config'
import type { FingerCurls } from './classify'
import type { HandSource, Landmark, Pose, TrackingStatus } from './types'

/** Hot path. Mutated in place by the tracker; read in rAF / useFrame loops. */
export const hand = {
  /** Filtered landmarks, or null when no hand is in frame. */
  landmarks: null as Landmark[] | null,
  /**
   * Cursor position in normalized screen space (0..1, y down), taken from the
   * middle-finger MCP — the steadiest point on the hand, and unlike a fingertip
   * it doesn't move when you change pose, so the cursor holds still while you
   * pinch.
   */
  x: 0.5,
  y: 0.5,
  /** Cursor velocity in normalized units per second. Drives spin inertia later. */
  vx: 0,
  vy: 0,
  /** The committed pose — gated for stability. Drive irreversible actions off this. */
  pose: 'none' as Pose,
  /**
   * The pose on *this* frame, ungated.
   *
   * Exists so visual feedback can respond on the very first frame while the
   * committed pose still waits out its stability gate — the same split as
   * mousedown (instant highlight) versus click (the actual navigation). Without
   * it the gate's 90-170ms reads as input lag rather than as deliberate care.
   * Never trigger anything irreversible from this.
   */
  rawPose: 'none' as Pose,
  /** Frames the current raw pose has held. The tracker requires a few before committing. */
  poseAge: 0,
  /** 0..1 progress of the current raw pose toward committing. For progress affordances. */
  poseProgress: 0,
  present: false,
  pinchDistance: 1,
  /** Thumb-tip to index-MCP distance / span. Low = tucked (peace), high = up (three). */
  thumbSpread: 1,
  /** Wrist->middle-MCP span. Larger = hand closer to the camera. */
  span: 0,
  curls: { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 } as FingerCurls,
  /** Diagnostics, reachable as `window.hand` in dev. */
  inferenceMs: 0,
  fps: 0,
}

export type HandState = typeof hand

export const handUI = proxy({
  status: 'idle' as TrackingStatus,
  source: 'camera' as HandSource,
  /** Populated on 'error'/'denied' so the overlay can say what actually failed. */
  message: '',
  present: false,
  /** Debounced — only updates once a pose has held long enough to commit. */
  pose: 'none' as Pose,
  /** Mirrors `hand.fps`, sampled once a second so it doesn't thrash React. */
  fps: 0,
  inferenceMs: 0,
})

export const useHandUI = () => useProxy(handUI)

/**
 * Landmarker settings, read when the tracker starts. Left as a proxy rather than
 * folded into constants because they can only take effect on a restart, so any
 * future control over them has to rebuild the tracker anyway.
 */
export const handSettings = proxy<RuntimeSettings>({ ...DEFAULT_RUNTIME_SETTINGS })

// Expose the live state for console poking and for driving the pipeline from
// automated checks. Dev only — this is a debugging affordance, not an API.
if (DEBUG && typeof window !== 'undefined') {
  ;(window as unknown as { hand: typeof hand; handUI: typeof handUI }).hand = hand
  ;(window as unknown as { hand: typeof hand; handUI: typeof handUI }).handUI = handUI
}

export function resetHand() {
  hand.landmarks = null
  hand.present = false
  hand.pose = 'none'
  hand.rawPose = 'none'
  hand.poseAge = 0
  hand.poseProgress = 0
  hand.vx = 0
  hand.vy = 0
  hand.pinchDistance = 1
  hand.thumbSpread = 1
  hand.span = 0
  handUI.present = false
  handUI.pose = 'none'
}

/**
 * Full reset, including the diagnostics. Used when tracking stops or fails, so
 * nothing downstream can keep reading a live-looking frame rate or a stale
 * skeleton from a session that has already ended.
 */
export function resetHandAll() {
  resetHand()
  hand.fps = 0
  hand.inferenceMs = 0
  hand.x = 0.5
  hand.y = 0.5
  hand.curls = { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 }
}
