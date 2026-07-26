import type { ReactNode } from 'react'
import { AdaptiveEvents, PerformanceMonitor } from '@react-three/drei'
import { AdaptiveSceneDpr } from './AdaptiveSceneDpr'

// Shared framerate guardrails for every 3D page.
//
// <AdaptiveSceneDpr> stands in for drei's <AdaptiveDpr>: it applies the same
// reactive `performance.current` scaling *and* the hand-mode backoff from one
// place, because two components writing dpr silently overwrite each other (see
// its header). PerformanceMonitor still supplies performance.current.
export function PerfGuardrails({ children }: { children?: ReactNode }) {
  return (
    <PerformanceMonitor bounds={() => [45, 60]}>
      <AdaptiveSceneDpr />
      <AdaptiveEvents />
      {children}
    </PerformanceMonitor>
  )
}
