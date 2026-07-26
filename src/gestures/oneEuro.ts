// One-Euro filter (Casiez, Roussel & Vogel, CHI 2012).
//
// This is the single biggest quality lever in the whole pipeline. Raw MediaPipe
// landmarks shake by several pixels even with a perfectly still hand, and the
// obvious fix — a fixed low-pass, e.g. the `easing.damp` used elsewhere in this
// codebase — trades that jitter for constant lag, so a moving hand always drags
// behind the cursor.
//
// One-Euro makes the cutoff frequency a function of speed: heavy smoothing when
// the hand is nearly still (kills jitter, and lag doesn't matter because nothing
// is moving), light smoothing when it's moving fast (kills lag, and jitter is
// invisible under motion).

/** Exponential smoothing with a per-call alpha. */
class LowPass {
  private y: number | null = null
  private s = 0

  filter(value: number, alpha: number): number {
    this.s = this.y === null ? value : alpha * value + (1 - alpha) * this.s
    this.y = value
    return this.s
  }

  reset() {
    this.y = null
    this.s = 0
  }
}

export interface OneEuroOptions {
  /** Cutoff at zero speed, in Hz. Lower = steadier when still, but laggier to start. */
  minCutoff?: number
  /** How aggressively the cutoff opens up with speed. Higher = less lag when moving. */
  beta?: number
  /** Cutoff for the speed estimate itself. Rarely needs changing. */
  dCutoff?: number
}

export class OneEuroFilter {
  private x = new LowPass()
  private dx = new LowPass()
  private lastTime: number | null = null
  private prev: number | null = null

  minCutoff: number
  beta: number
  dCutoff: number

  constructor({ minCutoff = 1.2, beta = 0.02, dCutoff = 1 }: OneEuroOptions = {}) {
    this.minCutoff = minCutoff
    this.beta = beta
    this.dCutoff = dCutoff
  }

  /** @param timestamp in seconds. */
  filter(value: number, timestamp: number): number {
    const dt = this.lastTime === null ? 0 : timestamp - this.lastTime
    this.lastTime = timestamp

    // First sample, or a clock jump (tab was backgrounded, or the hand left and
    // came back): pass the value straight through rather than deriving a
    // nonsense velocity from a multi-second dt.
    if (this.prev === null || dt <= 0 || dt > 0.5) {
      this.x.reset()
      this.dx.reset()
      this.prev = value
      return this.x.filter(value, 1)
    }

    const rate = 1 / dt
    // Speed estimate, itself low-passed so a single noisy sample can't blow the
    // cutoff wide open and let the jitter straight through.
    const speed = this.dx.filter((value - this.prev) * rate, alpha(rate, this.dCutoff))
    const cutoff = this.minCutoff + this.beta * Math.abs(speed)
    this.prev = value
    return this.x.filter(value, alpha(rate, cutoff))
  }

  reset() {
    this.x.reset()
    this.dx.reset()
    this.lastTime = null
    this.prev = null
  }
}

function alpha(rate: number, cutoff: number): number {
  const tau = 1 / (2 * Math.PI * cutoff)
  return 1 / (1 + tau * rate)
}

/**
 * A One-Euro filter per coordinate across all 21 landmarks, filtering in place
 * to keep the hot path allocation-free.
 */
export class LandmarkFilter {
  private filters: OneEuroFilter[] = []
  private options: OneEuroOptions

  constructor(options: OneEuroOptions = {}) {
    this.options = options
  }

  /** @param timestamp in seconds. */
  apply(landmarks: { x: number; y: number; z: number }[], timestamp: number) {
    for (let i = 0; i < landmarks.length; i++) {
      const base = i * 3
      // Lazily grown so this works for any landmark count without a constant.
      for (let axis = 0; axis < 3; axis++) {
        this.filters[base + axis] ??= new OneEuroFilter(this.options)
      }
      const lm = landmarks[i]
      lm.x = this.filters[base].filter(lm.x, timestamp)
      lm.y = this.filters[base + 1].filter(lm.y, timestamp)
      lm.z = this.filters[base + 2].filter(lm.z, timestamp)
    }
  }

  /** Call when the hand leaves frame, so it doesn't lerp across the gap on return. */
  reset() {
    for (const f of this.filters) f.reset()
  }
}
