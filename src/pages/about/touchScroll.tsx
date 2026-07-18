import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { easing } from 'maath'
import * as THREE from 'three'

// Touch-only replacement for drei's <ScrollControls>/useScroll(). Why: drei's
// ScrollControls creates its own internal overflow:auto div and traps every
// touch gesture inside it — the real document <body> never scrolls. iOS
// Safari's translucent-bottom-bar bleed-through is tied specifically to
// genuine top-level document scrolling (confirmed by comparing against the
// Contact page, which uses plain document flow and bleeds correctly); a
// nested div scrolling — even from a real finger — doesn't trigger it. So on
// touch we let the real document scroll (a tall spacer in AboutPage provides
// the room) and drive the exact same offset/range API off that instead.

type TouchScrollState = { offset: number; pages: number; range: (from: number, distance: number, margin?: number) => number }

function makeRange(state: { offset: number }) {
  return (from: number, distance: number, margin = 0) => {
    const start = from - margin
    const end = start + distance + margin * 2
    return state.offset < start ? 0 : state.offset > end ? 1 : (state.offset - start) / (end - start)
  }
}

const dummyState: TouchScrollState = { offset: 0, pages: 1, range: () => 0 }
const TouchScrollContext = createContext<TouchScrollState>(dummyState)

/** Touch-only scroll state; returns an inert dummy off the provider (desktop). */
export function useTouchScroll() {
  return useContext(TouchScrollContext)
}

export function TouchScrollProvider({ pages, damping = 0.2, children }: { pages: number; damping?: number; children: ReactNode }) {
  const state = useMemo(() => {
    const s: TouchScrollState = { offset: 0, pages, range: () => 0 }
    s.range = makeRange(s)
    return s
  }, [pages])
  const raw = useRef(0)
  useEffect(() => {
    const doc = document.scrollingElement as HTMLElement
    const onScroll = () => {
      const max = doc.scrollHeight - doc.clientHeight
      raw.current = max > 0 ? doc.scrollTop / max : 0
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useFrame((_, delta) => {
    easing.damp(state, 'offset', raw.current, damping, delta)
  })
  return <TouchScrollContext.Provider value={state}>{children}</TouchScrollContext.Provider>
}

/** Touch replacement for drei's <Scroll> (WebGL variant): same y-translate formula. */
export function TouchScrollGroup({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null!)
  const scroll = useTouchScroll()
  const height = useThree((s) => s.viewport.height)
  useFrame(() => {
    // Read scroll.offset live inside the frame loop, not destructured above —
    // mutating state.offset (see TouchScrollProvider) doesn't trigger a React
    // re-render, so a destructured snapshot would freeze at its initial value.
    group.current.position.y = height * (scroll.pages - 1) * scroll.offset
  })
  return <group ref={group}>{children}</group>
}
