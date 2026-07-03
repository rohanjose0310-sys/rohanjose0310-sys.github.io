import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'

// App-wide smooth scroll. A single instance driven by gsap's ticker so scroll
// and gsap animations share one clock (recommended lenis+gsap integration).
// Inert on non-scrolling pages (e.g. the home hero) — costs nothing there.
export function useLenis() {
  useEffect(() => {
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
  }, [])
}
