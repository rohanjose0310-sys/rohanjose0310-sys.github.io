import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** Public URL the hand-tracking worker importScripts()es. Keep in sync with gestures/config.ts. */
const MEDIAPIPE_BUNDLE_URL = '/mediapipe/vision_bundle.js'

/**
 * Serve @mediapipe/tasks-vision's CommonJS build from our own origin, as .js.
 *
 * The hand landmarker worker has to be a *classic* worker (MediaPipe loads its
 * wasm glue with importScripts, which module workers don't have), and a classic
 * worker can't `import`, so it pulls the library in with importScripts too.
 * That rules out both other sources:
 *   - the .mjs build has `export` statements, which a classic script can't parse
 *   - jsDelivr serves the .cjs as `content-type: application/node` with
 *     `x-content-type-options: nosniff`, so no browser will execute it
 * Copying it to a .js path on our own origin gives it a JavaScript MIME type.
 *
 * Reading straight out of node_modules means the served file can never drift
 * from the installed version, which a checked-in copy eventually would.
 */
function mediapipeClassicBundle(): Plugin {
  const require = createRequire(import.meta.url)
  let cached: Buffer | undefined
  const source = () =>
    (cached ??= readFileSync(
      require.resolve('@mediapipe/tasks-vision').replace(/vision_bundle\.mjs$/, 'vision_bundle.cjs'),
    ))

  return {
    name: 'mediapipe-classic-bundle',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== MEDIAPIPE_BUNDLE_URL) return next()
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        res.end(source())
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        // Fixed name, not hashed: gestures/config.ts references it by literal path.
        fileName: MEDIAPIPE_BUNDLE_URL.replace(/^\//, ''),
        source: source(),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // User site served at the root domain — must NOT be a subpath base.
  base: '/',
  plugins: [react(), mediapipeClassicBundle()],
  // The hand landmarker worker must be a *classic* worker, not a module one:
  // @mediapipe/tasks-vision loads its wasm glue with importScripts(), which
  // does not exist in module workers and fails with the singularly unhelpful
  // "ModuleFactory not set." Bundling workers as IIFE keeps importScripts
  // available. See google-ai-edge/mediapipe#5527.
  worker: { format: 'iife' },
})
