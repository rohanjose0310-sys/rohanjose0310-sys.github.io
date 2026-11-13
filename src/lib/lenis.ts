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

    // Lenis only re-measures when <html> itself resizes, and index.css pins
    // html/body/#root to height: 100% — so a page that grows after Lenis
    // measured (a long DOM page like /projects/:id/story, reached from a
    // fixed-canvas page) keeps a scroll limit of 0 and swallows the wheel,
    // leaving only the scrollbar working. Re-measure when the real document
    // height changes.
    let lastHeight = document.documentElement.scrollHeight
    const update = (time: number) => {
      const height = document.documentElement.scrollHeight
      if (height !== lastHeight) {
        lastHeight = height
        lenis.resize()
      }
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
