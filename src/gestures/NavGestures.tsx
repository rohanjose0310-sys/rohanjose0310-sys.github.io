// App-level back/scroll gestures for every page except home.
//
// Home is excluded on purpose: its carousel already owns open-palm gestures, and
// there is nothing to go "back" from. Everywhere else:
//
//   open palm, dragged vertically   -> scroll   (via the NavGestureEngine)
//   the "three" pose (thumb+index+middle up) -> back  (-> navigate home)
//
// Back is a static pose rather than a swipe: a directional flick was unreliable
// to trigger, and a distinct hand shape can never be confused with the scroll
// drag. It reads the *committed* (stability-gated) pose, so a transient misread
// can't navigate, and fires on the rising edge so one gesture goes back once.

import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { hand, useHandUI } from './store'
import { NavGestureEngine } from './navGestureEngine'
import { emitScroll } from './navIntent'
import './navHud.css'

/** Routes that actually scroll — used only to tailor the hint copy. */
const SCROLL_ROUTES = new Set(['/about'])

export function NavGestures() {
  const { pathname } = useLocation()
  const ui = useHandUI()
  const navigate = useNavigate()
  // Home drives its own gestures (the carousel); back has no meaning there.
  const active = ui.status === 'running' && pathname !== '/'
  const wasThree = useRef(false)

  useEffect(() => {
    if (!active) return
    const engine = new NavGestureEngine()
    let raf = 0
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick)

      const scroll = engine.update({
        present: hand.present,
        pose: hand.rawPose,
        x: hand.x,
        y: hand.y,
        t,
      })
      if (scroll) emitScroll(scroll)

      // Back off the committed pose, on its rising edge. Committed (not raw) so
      // the stability gate has already vetted it; rising edge so holding the
      // pose fires exactly one navigation. Navigating unmounts this effect, so
      // there's no second fire from the same hold.
      const three = hand.pose === 'three'
      if (three && !wasThree.current) navigate('/')
      wasThree.current = three
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, navigate])

  if (!active) return null
  return <NavHud scrollable={SCROLL_ROUTES.has(pathname)} />
}

/** A dim, present-aware hint — the only way back/scroll are discoverable. */
function NavHud({ scrollable }: { scrollable: boolean }) {
  const [present, setPresent] = useState(hand.present)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      // Cheap: a boolean that changes at most a few times a second.
      setPresent((p) => (p === hand.present ? p : hand.present))
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div className={`nav-hud${present ? ' is-live' : ''}`}>
      {scrollable && (
        <span>
          open hand <b>↕</b> scroll
        </span>
      )}
      {scrollable && <span className="nav-hud__sep">·</span>}
      <span>
        <b>three fingers</b> to go back
      </span>
    </div>
  )
}
