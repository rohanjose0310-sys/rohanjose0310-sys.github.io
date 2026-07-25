// Synthetic hand source — a kinematic hand driven by mouse and keyboard.
//
// This is not a convenience. The in-app preview browser blocks getUserMedia
// outright (`NotAllowedError`, with the camera plainly present), so without a
// synthetic source there is no way to exercise this pipeline during development
// except by hand-testing every change in a real browser.
//
// It deliberately emits real 21-point landmark sets rather than faking the
// classifier's output, and adds a little positional noise, so the actual
// classifier and the actual One-Euro filter are both under test. If a pose is
// hard to hit here, it will be hard to hit with a real hand.
//
// Controls: move the mouse to move the hand. Hold F for a fist, P (or the left
// mouse button) to pinch, I to point; open palm otherwise. Press H to take the
// hand out of frame.

import { LM, type Landmark } from './types'

/** Local-space finger layout, in units of hand span (wrist -> middle MCP = 1). */
interface FingerSpec {
  mcp: [number, number]
  /** Radians from +Y, fanning outward. */
  baseAngle: number
  /** Segment lengths: mcp->pip, pip->dip, dip->tip. */
  lengths: [number, number, number]
}

const deg = (d: number) => (d * Math.PI) / 180

const FINGERS: Record<'index' | 'middle' | 'ring' | 'pinky', FingerSpec> = {
  index: { mcp: [-0.35, 0.95], baseAngle: deg(-12), lengths: [0.42, 0.26, 0.2] },
  middle: { mcp: [0, 1.0], baseAngle: deg(0), lengths: [0.46, 0.28, 0.21] },
  ring: { mcp: [0.33, 0.95], baseAngle: deg(12), lengths: [0.42, 0.26, 0.2] },
  pinky: { mcp: [0.62, 0.85], baseAngle: deg(24), lengths: [0.33, 0.2, 0.17] },
}

// Bend applied at each joint at full curl. Chosen so a fully curled finger
// lands near 0.36 extension and a straight one at 1.0 — comfortably either side
// of the classifier's 0.42/0.72 thresholds, with room to spare for the noise.
const MCP_BEND = deg(45)
const PIP_BEND = deg(120)
const DIP_BEND = deg(110)

export interface SyntheticPose {
  /** 0 = straight, 1 = fully curled, per finger. */
  index: number
  middle: number
  ring: number
  pinky: number
  /** 0 = thumb out, 1 = thumb tip on the index tip. */
  pinch: number
}

const OPEN_PALM: SyntheticPose = { index: 0, middle: 0, ring: 0, pinky: 0, pinch: 0 }
// A real fist tucks the thumb across the curled fingers, which puts the thumb
// tip close to the index tip. Modelling it with the thumb held out instead made
// fists trivially separable from pinches here while they were being confused
// for each other on an actual hand.
const FIST: SyntheticPose = { index: 1, middle: 1, ring: 1, pinky: 1, pinch: 0.75 }
const PINCH: SyntheticPose = { index: 0, middle: 0, ring: 0, pinky: 0, pinch: 1 }
const POINT: SyntheticPose = { index: 0, middle: 1, ring: 1, pinky: 1, pinch: 0 }

/** Build a 21-point hand in local space, +Y toward the fingertips. */
function buildLocal(pose: SyntheticPose): Landmark[] {
  const lms: Landmark[] = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }))
  lms[LM.WRIST] = { x: 0, y: 0, z: 0 }

  const chain = (spec: FingerSpec, curl: number, indices: [number, number, number, number]) => {
    let [x, y] = spec.mcp
    lms[indices[0]] = { x, y, z: 0 }
    let angle = spec.baseAngle + curl * MCP_BEND
    const bends = [0, PIP_BEND, DIP_BEND]
    for (let i = 0; i < 3; i++) {
      angle += curl * bends[i]
      x += Math.sin(angle) * spec.lengths[i]
      y += Math.cos(angle) * spec.lengths[i]
      lms[indices[i + 1]] = { x, y, z: 0 }
    }
  }

  chain(FINGERS.index, pose.index, [LM.INDEX_MCP, LM.INDEX_PIP, LM.INDEX_DIP, LM.INDEX_TIP])
  chain(FINGERS.middle, pose.middle, [LM.MIDDLE_MCP, LM.MIDDLE_PIP, LM.MIDDLE_DIP, LM.MIDDLE_TIP])
  chain(FINGERS.ring, pose.ring, [LM.RING_MCP, LM.RING_PIP, LM.RING_DIP, LM.RING_TIP])
  chain(FINGERS.pinky, pose.pinky, [LM.PINKY_MCP, LM.PINKY_PIP, LM.PINKY_DIP, LM.PINKY_TIP])

  // Thumb: a straight chain angled away from the palm, then swung toward the
  // index tip as `pinch` rises. Lerping the joints toward the target rather
  // than solving IK is crude, but the classifier only measures thumb-tip to
  // index-tip distance and the thumb's own joint angles, both of which this
  // reproduces faithfully enough to tune against.
  const thumbBase: [number, number] = [-0.45, 0.25]
  const thumbAngle = deg(-52)
  const thumbLengths = [0.35, 0.28, 0.22]
  let tx = thumbBase[0]
  let ty = thumbBase[1]
  lms[LM.THUMB_CMC] = { x: tx, y: ty, z: 0 }
  const thumbIdx = [LM.THUMB_MCP, LM.THUMB_IP, LM.THUMB_TIP]
  for (let i = 0; i < 3; i++) {
    tx += Math.sin(thumbAngle) * thumbLengths[i]
    ty += Math.cos(thumbAngle) * thumbLengths[i]
    lms[thumbIdx[i]] = { x: tx, y: ty, z: 0 }
  }
  if (pose.pinch > 0) {
    const target = lms[LM.INDEX_TIP]
    // The tip travels the full distance, the joints proportionally less, so the
    // thumb folds rather than translating rigidly.
    const weights = [0.25, 0.6, 1]
    for (let i = 0; i < 3; i++) {
      const lm = lms[thumbIdx[i]]
      const t = pose.pinch * weights[i]
      lm.x += (target.x - lm.x) * t
      lm.y += (target.y - lm.y) * t
    }
  }
  return lms
}

/** Box-Muller, so the noise looks like sensor noise rather than a uniform buzz. */
function gaussian(): number {
  const u = Math.random() || 1e-9
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random())
}

export class SyntheticSource {
  /** Normalized pointer position, in the same un-mirrored space a camera reports. */
  private px = 0.5
  private py = 0.5
  private held = new Set<string>()
  private mouseDown = false
  /** Hand span as a fraction of frame height — roughly an arm's length away. */
  private scale = 0.22
  /** Jitter amplitude in normalized units, matching what a real webcam produces. */
  noise = 0.0015
  present = true

  private onPointerMove = (e: PointerEvent) => {
    // A viewport can genuinely report 0 (a tab that has not been laid out yet,
    // a hidden iframe, an inspector pane). Hold the last good position rather
    // than dividing by it — 0/0 is NaN, and NaN entering the filter is
    // permanent, since it propagates through every subsequent blend.
    const w = window.innerWidth
    const h = window.innerHeight
    if (!w || !h) return
    // Mirrored on the way in: a real camera sees your right hand on the left of
    // its frame, and the tracker un-mirrors it downstream. Feeding synthetic
    // data in the same handedness keeps that step under test.
    this.px = 1 - e.clientX / w
    this.py = e.clientY / h
  }
  private onDown = () => (this.mouseDown = true)
  private onUp = () => (this.mouseDown = false)
  private onKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase()
    if (key === 'h') this.present = !this.present
    this.held.add(key)
  }
  private onKeyUp = (e: KeyboardEvent) => this.held.delete(e.key.toLowerCase())

  start() {
    window.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('pointerdown', this.onDown)
    window.addEventListener('pointerup', this.onUp)
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  stop() {
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerdown', this.onDown)
    window.removeEventListener('pointerup', this.onUp)
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  }

  private currentPose(): SyntheticPose {
    if (this.held.has('f')) return FIST
    if (this.held.has('p') || this.mouseDown) return PINCH
    if (this.held.has('i')) return POINT
    return OPEN_PALM
  }

  /** Landmarks for this tick, in normalized frame space, or null if out of frame. */
  sample(): Landmark[] | null {
    if (!this.present) return null
    const local = buildLocal(this.currentPose())
    // Local +Y is toward the fingertips (up on screen), image +Y is down.
    return local.map((lm) => ({
      x: this.px + lm.x * this.scale + gaussian() * this.noise,
      y: this.py - lm.y * this.scale + gaussian() * this.noise,
      z: lm.z,
    }))
  }
}
