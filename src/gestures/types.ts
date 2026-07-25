// Shared vocabulary for the hand-tracking pipeline.
//
// The pipeline is deliberately layered so that nothing downstream of the
// classifier ever sees a landmark: worker -> landmarks -> filter -> classifier
// -> intents. Pages subscribe to intents only, which is what keeps hands a peer
// of mouse and touch rather than a fork of every page's input handling.

/** One of MediaPipe's 21 hand landmarks. x/y are normalized 0..1 of the frame. */
export interface Landmark {
  x: number
  y: number
  /** Depth relative to the wrist. Unreliable in absolute terms — see NOTE below. */
  z: number
}

// NOTE on z: MediaPipe's z is "roughly" wrist-relative depth in the same scale
// as x, but it is noisy enough that using it for interaction feels broken. When
// we eventually want depth, derive it from the wrist->middle-MCP pixel span
// (which shrinks with distance) rather than trusting this value.

/** Indices into the 21-point landmark array, in MediaPipe's published order. */
export const LM = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const

/** Bone pairs for drawing the skeleton in the debug overlay. */
export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // index
  [5, 9], [9, 10], [10, 11], [11, 12], // middle
  [9, 13], [13, 14], [14, 15], [15, 16], // ring
  [13, 17], [17, 18], [18, 19], [19, 20], // pinky
  [0, 17], // palm base
]

/**
 * The phase-1 gesture vocabulary. Kept to four poses on purpose: pose
 * confusion grows fast past that, and every extra pose steals recall from the
 * ones that matter.
 */
export type Pose = 'none' | 'open_palm' | 'fist' | 'pinch' | 'point'

export type HandSource = 'camera' | 'synthetic'

export type TrackingStatus =
  | 'idle' // never started
  | 'loading' // fetching wasm + model, or waiting on the camera
  | 'running'
  | 'denied' // user refused the camera, or the context has none
  | 'error'

/** What the worker sends back for each processed frame. */
export interface WorkerResult {
  landmarks: Landmark[] | null
  /** 'Left' | 'Right' as MediaPipe labels it — note this is the *mirrored* view. */
  handedness: string | null
  /** Inference wall time in ms, for the overlay's perf readout. */
  inferenceMs: number
  timestamp: number
}

export type WorkerRequest =
  | {
      type: 'init'
      /** CommonJS build of tasks-vision, loaded with importScripts — see the worker. */
      bundlePath: string
      wasmPath: string
      modelPath: string
      delegate: 'GPU' | 'CPU'
    }
  | { type: 'detect'; bitmap: ImageBitmap; timestamp: number }
  | { type: 'close' }

export type WorkerResponse =
  | { type: 'ready' }
  | { type: 'result'; result: WorkerResult }
  | { type: 'error'; message: string }
