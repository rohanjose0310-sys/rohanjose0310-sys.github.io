// App-level back/scroll gestures for every page except home.
//
// Home is excluded on purpose: its carousel already owns open-palm-horizontal
// for spinning, and there is nothing to go "back" from. Everywhere else, this
// runs the NavGestureEngine against the live hand state and turns its intents
// into a route change (back) and scroll deltas (delivered through navIntent's
// registered sink — window scroll by default, the About Canvas otherwise).

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { hand, useHandUI } from './store'
import { BACK_DIRECTION, NavGestureEngine } from './navGestureEngine'
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

  useEffect(() => {
    if (!active) return
    const engine = new NavGestureEngine()
    let raf = 0
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick)
      const intent = engine.update({
        present: hand.present,
        pose: hand.rawPose,
        x: hand.x,
        y: hand.y,
        t,
      })
      if (intent.scroll) emitScroll(intent.scroll)
      // Fires at most once per swipe (the engine latches); navigating unmounts
      // this effect, so there's no risk of a second fire from the same motion.
      if (intent.back) navigate('/')
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, navigate])

  if (!active) return null
  return <NavHud scrollable={SCROLL_ROUTES.has(pathname)} />
}

const BACK_ARROW = BACK_DIRECTION < 0 ? '←' : '→'

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
        swipe <b>{BACK_ARROW}</b> back
      </span>
    </div>
  )
}
