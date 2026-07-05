import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'

// App-wide smooth scroll. A single instance driven by gsap's ticker so scroll
// and gsap animations share one clock (recommended lenis+gsap integration).
//
// NOTE: Lenis hijacks wheel events document-wide (preventDefault), which
// breaks drei <ScrollControls> — its scroll overlay never receives the wheel.
// Pages built around ScrollControls must pass enabled=false for their route.
export function useLenis(enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const lenis = new Lenis()

    const update = (time: number) => {
      lenis.raf(time * 1000) // gsap ticker time is seconds; lenis wants ms
    }
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(update)
      lenis.destroy()
    }
  }, [enabled])
}
