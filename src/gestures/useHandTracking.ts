import { useCallback, useEffect, useRef } from 'react'
import { HandTracker } from './tracker'
import { handUI } from './store'
import { DEBUG } from '../lib/debug'
import type { HandSource } from './types'

// One tracker for the whole app. It owns a camera, a worker and a ~11MB model
// download, none of which should ever exist twice — and React 19 StrictMode
// double-invokes effects in dev, which would do exactly that with a
// per-component instance.
let singleton: HandTracker | null = null

export function getTracker(): HandTracker {
  return (singleton ??= new HandTracker())
}

// Reachable as `getTracker().start('synthetic')` in dev — the only way to tune
// gesture feel against real filtered landmarks without a webcam, since
// synthetic.ts drives the actual One-Euro filter and classifier from the mouse.
// Same debugging affordance store.ts gives `hand`.
if (DEBUG && typeof window !== 'undefined') {
  ;(window as unknown as { getTracker: typeof getTracker }).getTracker = getTracker
}

/**
 * Start/stop control for the hand pipeline. Nothing loads until start() is
 * called — the model and wasm are only fetched on explicit opt-in.
 */
export function useHandTracking() {
  const tracker = getTracker()
  const startedRef = useRef(false)

  const start = useCallback(
    (source: HandSource) => {
      startedRef.current = true
      void tracker.start(source)
    },
    [tracker],
  )

  const stop = useCallback(() => {
    startedRef.current = false
    tracker.stop()
  }, [tracker])

  // Free the camera when the tab is hidden. Leaving the capture light on behind
  // a backgrounded tab is the kind of thing that (rightly) makes people distrust
  // a site that asked for their webcam.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && handUI.status === 'running') tracker.stop()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [tracker])

  return { tracker, start, stop }
}
