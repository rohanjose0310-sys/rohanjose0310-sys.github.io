// The single owner of the scene's pixel ratio, and the publisher of scene stats.
//
// This replaces drei's <AdaptiveDpr>, rather than sitting alongside it, because
// two components writing dpr silently fight. AdaptiveDpr sets
// `dpr = performance.current * viewport.initialDpr` on every performance change,
// and `initialDpr` is captured once at Canvas creation and never updated — so any
// other reduction (a changed `dpr` prop, an imperative setDpr) gets reverted the
// next time the framerate wobbles. Folding both inputs into one component keeps
// that from happening:
//
//   dpr = performance.current  (drei's PerformanceMonitor, reactive)
//       x base                 (the page's own cap)
//       x hand factor          (proactive, while tracking a hand on a heavy page)

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useLocation } from 'react-router-dom'
import { useHandUI } from '../gestures/store'
import { HAND_DPR_FACTOR, isHeavyRoute } from './sceneCost'
import { sceneStats } from './sceneStats'

export function AdaptiveSceneDpr() {
  const setDpr = useThree((state) => state.setDpr)
  const current = useThree((state) => state.performance.current)
  const gl = useThree((state) => state.gl)
  // The ratio this Canvas started at — the device's, already clamped to whatever
  // cap the page passed. Taking it from the store rather than a prop means this
  // drops into any Canvas, including the pages that build their own.
  const base = useThree((state) => state.viewport.initialDpr)
  const { pathname } = useLocation()
  const ui = useHandUI()

  const backedOff = ui.status === 'running' && isHeavyRoute(pathname)
  const factor = backedOff ? HAND_DPR_FACTOR : 1

  useEffect(() => {
    setDpr(current * base * factor)
    sceneStats.backedOff = backedOff
  }, [setDpr, current, base, factor, backedOff])

  // Publish render stats so the backoff's effect is measurable on a real machine
  // (see sceneStats). Rolling one-second window; per-instance rather than
  // module-level, since two Canvases briefly overlap during a route change.
  const frames = useRef<number[]>([])
  useFrame(() => {
    const now = performance.now()
    const f = frames.current
    f.push(now)
    while (f.length && now - f[0] > 1000) f.shift()
    sceneStats.fps = f.length
    // The renderer's own ratio, not a mirrored copy of viewport.dpr: a mirror
    // read at render time can lag behind the value it is meant to report, and a
    // stale number here is worse than none — this readout exists precisely to
    // verify the backoff.
    sceneStats.dpr = gl.getPixelRatio()
  })

  return null
}
