// The single owner of the scene's pixel ratio.
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

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useLocation } from 'react-router-dom'
import { useHandUI } from '../gestures/store'
import { HAND_DPR_FACTOR, isHeavyRoute } from './sceneCost'

export function AdaptiveSceneDpr() {
  const setDpr = useThree((state) => state.setDpr)
  const current = useThree((state) => state.performance.current)
  // The ratio this Canvas started at — the device's, already clamped to whatever
  // cap the page passed. Taking it from the store rather than a prop means this
  // drops into any Canvas, including the pages that build their own.
  const base = useThree((state) => state.viewport.initialDpr)
  const { pathname } = useLocation()
  const ui = useHandUI()

  // To confirm the backoff is really applied, read the canvas drawing buffer:
  // `canvas.width / canvas.clientWidth` is the ratio actually in effect.
  const factor = ui.status === 'running' && isHeavyRoute(pathname) ? HAND_DPR_FACTOR : 1

  useEffect(() => {
    setDpr(current * base * factor)
  }, [setDpr, current, base, factor])

  return null
}
