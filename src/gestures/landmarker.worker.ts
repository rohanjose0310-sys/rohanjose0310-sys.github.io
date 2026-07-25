/// <reference lib="webworker" />
// MediaPipe hand landmarker, off the main thread.
//
// This has to be a worker: detectForVideo() is *synchronous*, so on the main
// thread it stalls the render loop for its whole inference time. On the heavy
// pages (projects' bloom+LUT, models' transmission material) that is the
// difference between 60fps and a slideshow.
//
// It also has to be a *classic* worker, and it must contain no runtime imports.
// Both constraints come from the same place: @mediapipe/tasks-vision loads its
// wasm glue with importScripts(), which does not exist in module workers and
// fails with the unhelpful "ModuleFactory not set." Vite's dev server creates a
// module worker for both `?worker` and `?worker&inline` regardless of the
// `worker.format` config (verified — it only takes effect in `vite build`), so
// the only reliable way to get a classic worker in dev *and* prod is
// `new Worker(new URL(...))` with a file that has nothing to bundle.
//
// Hence: types come from the npm package (erased at compile time), and the
// runtime is pulled in with importScripts from the same pinned CDN that already
// serves the wasm — so this adds no dependency the pipeline didn't already have.
//
// Frames arrive as pre-downscaled ImageBitmaps — see camera.ts, which does the
// resize during createImageBitmap so we never upload full-resolution pixels the
// model is only going to shrink anyway.

// Types are pulled in as inline `import(...)` *type expressions*, never as
// `import type` statements. An import statement — even a type-only one — makes
// esbuild treat this file as an ES module and append `export {}` to it, which a
// classic worker cannot parse ("Unexpected token 'export'"). Written this way
// the file contains no module syntax at all, so it stays a plain script.
type Vision = typeof import('@mediapipe/tasks-vision')
type HandLandmarker = import('@mediapipe/tasks-vision').HandLandmarker
type NormalizedLandmark = import('@mediapipe/tasks-vision').NormalizedLandmark
type WorkerRequest = import('./types').WorkerRequest
type WorkerResponse = import('./types').WorkerResponse

const scope = self as unknown as {
  exports?: unknown
  module?: { exports: unknown }
  importScripts: (url: string) => void
}

/**
 * Load the CommonJS build into this worker's global scope.
 *
 * vision_bundle.cjs is plain CJS (it assigns to a bare `exports`), so it needs
 * those two globals to exist before it runs. Its one `require()` call sits in a
 * branch that is only reached after importScripts throws, so it never executes
 * here.
 */
function loadVision(bundleUrl: string): Vision {
  const exports = {}
  scope.exports = exports
  scope.module = { exports }
  scope.importScripts(bundleUrl)
  return exports as Vision
}

let landmarker: HandLandmarker | null = null
/** detectForVideo rejects a timestamp that doesn't advance, so clamp them monotonic. */
let lastTimestamp = -1

const post = (msg: WorkerResponse) => self.postMessage(msg)

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data
  try {
    switch (msg.type) {
      case 'init': {
        const { FilesetResolver, HandLandmarker } = loadVision(msg.bundlePath)
        const fileset = await FilesetResolver.forVisionTasks(msg.wasmPath)
        landmarker = await HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: msg.modelPath, delegate: msg.delegate },
          runningMode: 'VIDEO',
          // One hand only. Two doubles inference cost for a vocabulary that has
          // no two-handed gesture in it, and it makes handedness ambiguous.
          numHands: 1,
          // Detection confidence is deliberately higher than presence/tracking:
          // it gates whether a hand is acquired at all, and a false acquisition
          // (a face, a lamp) is far worse than a slow one. Once locked on,
          // looser tracking keeps it from dropping mid-gesture.
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })
        post({ type: 'ready' })
        break
      }

      case 'detect': {
        if (!landmarker) {
          msg.bitmap.close()
          return
        }
        const timestamp = Math.max(msg.timestamp, lastTimestamp + 1)
        lastTimestamp = timestamp
        const started = performance.now()
        const result = landmarker.detectForVideo(msg.bitmap, timestamp)
        // ImageBitmaps hold real memory and are not GC-prompt. Leaking these is
        // the classic way to make a tracking demo die after 30 seconds.
        msg.bitmap.close()

        const found = result.landmarks.length > 0
        post({
          type: 'result',
          result: {
            landmarks: found
              ? result.landmarks[0].map(({ x, y, z }: NormalizedLandmark) => ({ x, y, z }))
              : null,
            handedness: found ? (result.handednesses[0]?.[0]?.categoryName ?? null) : null,
            inferenceMs: performance.now() - started,
            timestamp,
          },
        })
        break
      }

      case 'close': {
        landmarker?.close()
        landmarker = null
        break
      }
    }
  } catch (error) {
    post({ type: 'error', message: error instanceof Error ? error.message : String(error) })
  }
}
