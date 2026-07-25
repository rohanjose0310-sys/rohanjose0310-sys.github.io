// Tuning constants and asset locations for the hand pipeline.

// Pinned to the exact installed version rather than @latest: the wasm and the
// JS glue are a matched pair, and a floating CDN tag has silently broken this
// package before. Keep in sync with package.json's @mediapipe/tasks-vision.
//
// These are the two heavy downloads — ~3.0MB brotli for the wasm, 7.8MB for the
// model — which is why nothing here is imported until the user opts in.
export const MEDIAPIPE_VERSION = '0.10.35'
const CDN = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}`
export const WASM_PATH = `${CDN}/wasm`
// The CommonJS build, loaded inside the worker with importScripts rather than
// bundled — see landmarker.worker.ts for why it cannot be an ESM import.
//
// Served from our own origin by the `mediapipe-classic-bundle` plugin in
// vite.config.ts (keep this path in sync with it), copied out of node_modules
// at serve/build time. It cannot come from the CDN: jsDelivr returns the .cjs
// as `application/node` with `nosniff`, which browsers refuse to execute.
export const BUNDLE_PATH = '/mediapipe/vision_bundle.js'
export const MODEL_PATH =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

/**
 * Inference rate. Hands do not move fast enough to need 60Hz, and halving the
 * rate roughly halves the GPU contention with whatever R3F scene is on screen.
 * Rendering still runs at 60fps — the One-Euro filter interpolates between
 * these samples, so the cursor never looks like it is stepping.
 */
export const INFERENCE_HZ = 22

/**
 * Width the camera frame is downscaled to before inference. The model works at
 * roughly this scale internally; sending 1280px frames just pays upload cost
 * for pixels it immediately throws away.
 */
export const INFERENCE_WIDTH = 320

/** Requested camera resolution. Kept modest — we downscale anyway. */
export const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
  audio: false,
}

// How long a raw pose must hold before it commits.
//
// Specified in *milliseconds with a frame floor*, not in frames. A pure frame
// count silently stretches when inference slows down: measured on this machine,
// Chrome sustains 21Hz but Safari only manages 12-13Hz for the same settings,
// which turned a 3-frame gate into 250ms of lag on Safari alone. Gating on time
// keeps the feel constant across browsers, and the frame floor keeps the
// anti-flicker guarantee that the gate exists for in the first place.
//
// At 22Hz these resolve to the same 3 and 2 frames as before; at 12Hz they cost
// ~167ms instead of 250ms.
export const POSE_STABILITY_MS = 130

/**
 * Pinch commits sooner. It is the only committing gesture, so latency is felt
 * far more sharply here than on a spin or a scroll — and its hysteresis band
 * (pinchOn/pinchOff in classify.ts) already does the anti-flicker job, so
 * requiring the full pose gate as well was paying twice for the same protection.
 */
export const PINCH_STABILITY_MS = 90

/**
 * ...but never fewer than this many frames, however fast inference is running.
 * One frame is not evidence: a single misread with thumb and index incidentally
 * close would fire a navigation, which is the Midas-touch failure this whole
 * gate exists to prevent.
 */
export const MIN_STABILITY_FRAMES = 2

/** One-Euro defaults. Retunable live through the calibration panel. */
export const FILTER_OPTIONS = { minCutoff: 1.2, beta: 0.02, dCutoff: 1 }

/**
 * Settings that can only take effect on a restart, because they are baked into
 * the landmarker at creation time or into the capture pipeline.
 *
 * These are exposed in the calibration panel because the right values are
 * machine- and browser-specific and cannot be determined from here: measured
 * inference on Safari/macOS was 36ms against ~16ms on Chromium for the same
 * model, which is the difference between hitting 22Hz and degrading to 15.
 */
export interface RuntimeSettings {
  /**
   * GPU means WebGL, not WebGPU (still unshipped upstream), so it contends with
   * whatever R3F scene is on screen. CPU is sometimes *faster* for a model this
   * small, and always leaves the GPU alone — worth measuring per machine rather
   * than assuming GPU wins.
   */
  delegate: 'GPU' | 'CPU'
  /** @see INFERENCE_WIDTH */
  inferenceWidth: number
  /** @see INFERENCE_HZ */
  inferenceHz: number
}

// Defaults are the config measured fastest across both browsers on real
// hardware: CPU at 256px gave 21/22Hz on Chrome and 12-13Hz on Safari, where GPU
// at 320px managed only 15Hz on Safari. CPU also leaves the GPU entirely to the
// R3F scene, which matters more here than on an ordinary page.
export const DEFAULT_RUNTIME_SETTINGS: RuntimeSettings = {
  delegate: 'CPU',
  inferenceWidth: 256,
  inferenceHz: INFERENCE_HZ,
}
