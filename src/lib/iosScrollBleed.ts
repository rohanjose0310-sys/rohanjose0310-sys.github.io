import { useEffect } from 'react'
import { IS_TOUCH } from './touch'

// iOS Safari only composites real page pixels behind its translucent bottom
// bar once the document has actually scrolled at least once — a page that
// never moves (like this WebGL-driven scene, where all "scrolling" happens
// inside ScrollControls' internal container, not <body>) keeps Safari's
// chrome in its flat, opaque resting state, producing a hard edge instead of
// the bleed-through effect other sites get. Classic fix: give <body> 1px of
// real scroll runway and nudge it there on mount/whenever it drifts back to
// 0, so Safari always treats the page as "scrolled". Purely invisible —
// fixed-position content isn't affected by body scroll offset.
export function useIosScrollBleed() {
  useEffect(() => {
    if (!IS_TOUCH) return
    const prevMinHeight = document.body.style.minHeight
    document.body.style.minHeight = 'calc(100% + 1px)'
    const nudge = () => {
      if (window.scrollY === 0) window.scrollTo(0, 1)
    }
    const t = window.setTimeout(nudge, 50)
    window.addEventListener('scroll', nudge, { passive: true })
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('scroll', nudge)
      document.body.style.minHeight = prevMinHeight
    }
  }, [])
}
