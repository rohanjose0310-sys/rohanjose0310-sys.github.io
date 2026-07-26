// The controller: source -> worker -> filter -> classifier -> store.
//
// Both sources land in the same ingest() so the camera and synthetic paths
// exercise identical downstream code. The only thing the source decides is
// where landmarks come from.

import { classify, DEFAULT_THRESHOLDS, type Thresholds } from './classify'
import { CameraSource, describeCameraError } from './camera'
import {
  BUNDLE_PATH,
  FILTER_OPTIONS,
  MODEL_PATH,
  WASM_PATH,
} from './config'
import { DEBUG } from '../lib/debug'
import { LandmarkFilter } from './oneEuro'
import { commitProgress, shouldCommit } from './stability'
import { hand, handSettings, handUI, resetHand, resetHandAll } from './store'
import { LM, type HandSource, type Landmark, type Pose, type WorkerResponse } from './types'

export class HandTracker {
  private worker: Worker | null = null
  private camera: CameraSource | null = null
  private synthetic: InstanceType<typeof import('./synthetic').SyntheticSource> | null = null
  private filter = new LandmarkFilter(FILTER_OPTIONS)
  private raf = 0
  private running = false
  /** One frame in flight at a time — queueing them just adds latency, never throughput. */
  private busy = false
  private lastSent = 0
  private lastIngest = 0
  private prevX = 0.5
  private prevY = 0.5
  /** Raw (pre-stability) pose, and how many consecutive frames it has held. */
  private rawPose: Pose = 'none'
  private rawCount = 0
  /** performance.now() when the current raw pose first appeared. */
  private rawSince = 0
  /** Feeds the pinch hysteresis — see classify(). */
  private pinching = false
  private frameTimes: number[] = []

  thresholds: Thresholds = { ...DEFAULT_THRESHOLDS }

  get videoElement(): HTMLVideoElement | null {
    return this.camera?.video ?? null
  }

  async start(source: HandSource) {
    if (this.running) return
    this.running = true
    handUI.source = source
    handUI.status = 'loading'
    handUI.message = ''

    try {
      if (source === 'synthetic') {
        // Dev-only. The kinematic hand model is a test instrument — it stays in
        // the tree because it is how every gesture in here was verified, and the
        // only way to exercise the pipeline where no camera is available (CI, or
        // any headless browser).
        //
        // Rollup still emits it as its own ~3KB chunk even though this branch is
        // dead in production — a dynamic import is a module-graph edge, created
        // before dead-code elimination. That chunk is never *requested* by a
        // visitor, since the else below throws first, so it costs them nothing to
        // download. Worth knowing rather than assuming it vanished.
        if (DEBUG) {
          const { SyntheticSource } = await import('./synthetic')
          this.synthetic = new SyntheticSource()
          this.synthetic.start()
        } else {
          throw new Error('the synthetic hand source is dev-only')
        }
      } else {
        this.camera = new CameraSource()
        // Concurrently, not in sequence: the worker's ~10.8MB of wasm and model
        // downloads while the permission prompt is still on screen, instead of
        // making the user wait for the whole thing *after* they say yes.
        await Promise.all([this.camera.start(), this.startWorker()])
      }
      if (!this.running) return this.stop() // stopped while we were awaiting
      handUI.status = 'running'
      this.loop()
    } catch (error) {
      const { denied, message } = describeCameraError(error)
      handUI.status = denied ? 'denied' : 'error'
      handUI.message = message
      this.running = false
      cancelAnimationFrame(this.raf)
      this.teardown()
      resetHandAll()
    }
  }

  private startWorker(): Promise<void> {
    return new Promise((resolve, reject) => {
      // No `{ type: 'module' }`, and deliberately the URL form rather than
      // `?worker`: this is the only construction Vite leaves as a *classic*
      // worker in dev, which MediaPipe requires. The worker file has no runtime
      // imports, so there is nothing for the bundler to inline. See the header
      // comment in landmarker.worker.ts.
      const worker = new Worker(new URL('./landmarker.worker.ts', import.meta.url))
      this.worker = worker
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const msg = event.data
        if (msg.type === 'ready') return resolve()
        if (msg.type === 'error') {
          // An error after startup shouldn't reject an already-settled promise;
          // put it on handUI.message instead so it isn't swallowed.
          handUI.status = 'error'
          handUI.message = msg.message
          return reject(new Error(msg.message))
        }
        if (msg.type === 'result') {
          this.busy = false
          this.ingest(msg.result.landmarks, msg.result.inferenceMs)
        }
      }
      worker.onerror = (event) => reject(new Error(event.message || 'worker failed to load'))
      worker.postMessage({
        type: 'init',
        bundlePath: BUNDLE_PATH,
        wasmPath: WASM_PATH,
        modelPath: MODEL_PATH,
        delegate: handSettings.delegate,
      })
    })
  }

  private loop = () => {
    if (!this.running) return
    this.raf = requestAnimationFrame(this.loop)
    const now = performance.now()
    const interval = 1000 / handSettings.inferenceHz
    if (now - this.lastSent < interval) return
    this.lastSent = now

    if (this.synthetic) {
      this.ingest(this.synthetic.sample(), 0)
      return
    }
    if (this.busy || !this.camera?.ready || !this.worker) return
    this.busy = true
    this.camera
      .grab()
      .then((bitmap) => {
        if (!bitmap || !this.worker) {
          this.busy = false
          return
        }
        this.worker.postMessage({ type: 'detect', bitmap, timestamp: now }, [bitmap])
      })
      .catch(() => {
        this.busy = false
      })
  }

  private ingest(landmarks: Landmark[] | null, inferenceMs: number) {
    const now = performance.now()
    const t = now / 1000
    const dt = this.lastIngest ? (now - this.lastIngest) / 1000 : 0
    this.lastIngest = now

    // Rolling one-second inference rate, for dev diagnostics.
    this.frameTimes.push(now)
    while (this.frameTimes.length && now - this.frameTimes[0] > 1000) this.frameTimes.shift()
    hand.fps = this.frameTimes.length
    hand.inferenceMs = inferenceMs

    // A single non-finite coordinate is unrecoverable once it reaches the
    // filter: NaN propagates through `alpha * v + (1 - alpha) * s` forever, so
    // the pipeline would stay dead long after the input recovered. Treat a bad
    // frame as no hand instead, which resets the filter cleanly.
    if (landmarks && !landmarks.every((lm) => Number.isFinite(lm.x) && Number.isFinite(lm.y))) {
      landmarks = null
    }

    if (!landmarks) {
      // Reset rather than letting the filter smooth across the gap — otherwise
      // a hand that leaves on the left and returns on the right sweeps the
      // cursor across everything in between.
      this.filter.reset()
      this.pinching = false
      this.rawPose = 'none'
      this.rawCount = 0
      resetHand()
      return
    }

    this.filter.apply(landmarks, t)
    const analysis = classify(landmarks, this.thresholds, this.pinching)
    this.pinching = analysis.pose === 'pinch'

    // Un-mirror: the camera sees you as if from the far side, so raw x runs
    // opposite to the direction you actually moved your hand.
    const x = 1 - landmarks[LM.MIDDLE_MCP].x
    const y = landmarks[LM.MIDDLE_MCP].y
    if (dt > 0 && hand.present) {
      hand.vx = (x - this.prevX) / dt
      hand.vy = (y - this.prevY) / dt
    } else {
      hand.vx = 0
      hand.vy = 0
    }
    this.prevX = x
    this.prevY = y

    hand.landmarks = landmarks
    hand.x = x
    hand.y = y
    hand.present = true
    hand.pinchDistance = analysis.pinchDistance
    hand.thumbSpread = analysis.thumbSpread
    hand.span = analysis.span
    hand.curls = analysis.curls

    // Stability gate: a pose has to hold for a few frames before it commits, so
    // the misreads that happen while fingers pass through intermediate
    // positions never reach the pages.
    if (analysis.pose === this.rawPose) {
      this.rawCount++
    } else {
      this.rawPose = analysis.pose
      this.rawCount = 1
      this.rawSince = now
    }
    hand.poseAge = this.rawCount
    // Ungated, for instant visual feedback — see `rawPose` in store.ts.
    hand.rawPose = this.rawPose
    const heldMs = now - this.rawSince
    hand.poseProgress = commitProgress(this.rawPose, heldMs, this.rawCount)
    if (hand.pose !== this.rawPose && shouldCommit(this.rawPose, heldMs, this.rawCount)) {
      hand.pose = this.rawPose
      handUI.pose = this.rawPose
    }
    if (!handUI.present) handUI.present = true
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
    this.teardown()
    resetHandAll()
    handUI.status = 'idle'
    handUI.message = ''
  }

  private teardown() {
    this.synthetic?.stop()
    this.synthetic = null
    this.camera?.stop()
    this.camera = null
    if (this.worker) {
      this.worker.postMessage({ type: 'close' })
      this.worker.terminate()
      this.worker = null
    }
    this.busy = false
    this.filter.reset()
  }
}
