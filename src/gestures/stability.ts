// When a raw pose is allowed to commit.
//
// Split out of the tracker so the rule can be tested on its own: the tracker
// needs a camera and a worker to run at all, and this decision is the part most
// worth getting right — it sets how responsive every gesture feels, and it is
// the guard against a single misread firing a navigation.

import { MIN_STABILITY_FRAMES, PINCH_STABILITY_MS, POSE_STABILITY_MS } from './config'
import type { Pose } from './types'

/** How long a pose must hold before committing, in ms. */
export function stabilityMs(pose: Pose): number {
  return pose === 'pinch' ? PINCH_STABILITY_MS : POSE_STABILITY_MS
}

/**
 * @param pose the raw (pre-commit) pose
 * @param heldMs how long it has held
 * @param frames how many consecutive inference frames it has held for
 *
 * Both conditions must pass. Time keeps the feel constant when inference rate
 * varies between browsers; the frame floor means a single misread can never
 * commit, however slow inference is.
 */
export function shouldCommit(pose: Pose, heldMs: number, frames: number): boolean {
  return heldMs >= stabilityMs(pose) && frames >= MIN_STABILITY_FRAMES
}

/**
 * How close the current raw pose is to committing, 0..1.
 *
 * Both conditions have to pass, so progress is the lesser of the two — that way
 * a progress affordance never sits full while the gate is still waiting on the
 * other half.
 */
export function commitProgress(pose: Pose, heldMs: number, frames: number): number {
  const byTime = heldMs / stabilityMs(pose)
  const byFrames = frames / MIN_STABILITY_FRAMES
  return Math.max(0, Math.min(1, Math.min(byTime, byFrames)))
}

/**
 * Frames a pose will take to commit at a given inference rate — what the gate
 * costs in practice, since frames arrive at discrete intervals.
 */
export function framesToCommit(pose: Pose, hz: number): number {
  const frameMs = 1000 / hz
  return Math.max(MIN_STABILITY_FRAMES, Math.ceil(stabilityMs(pose) / frameMs))
}
