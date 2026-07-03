import type { ReactNode } from 'react'
import { AdaptiveDpr, AdaptiveEvents, PerformanceMonitor } from '@react-three/drei'

// Shared framerate guardrails for every 3D page.
// Decline/incline handlers stay no-ops until profiling shows they're needed.
export function PerfGuardrails({ children }: { children?: ReactNode }) {
  return (
    <PerformanceMonitor bounds={() => [45, 60]}>
      <AdaptiveDpr />
      <AdaptiveEvents />
      {children}
    </PerformanceMonitor>
  )
}
