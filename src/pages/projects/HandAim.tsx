// Mounts hand control for the prism scene, plus the on-screen affordance.
//
// Same split as pages/home/HandCarousel.tsx: this component owns the lifecycle
// and the HUD, handAim.ts owns the gesture loop, and the scene itself stays
// unaware of both.
//
// The HUD is not decoration. Gestures have no discoverable surface, so the only
// way a visitor learns what their hand does is to be told — and the only way
// they trust a pinch is to watch it commit. It names the project a pinch would
// open and fills a bar as that pinch is accepted.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hand, useHandUI } from '../../gestures/store'
import { attachHandAim } from './aimControl'
import { aim } from './aim'
import { focus } from './focus'
import { getProject } from './projectData'
import './aimHud.css'

export function HandAim() {
  const ui = useHandUI()
  const navigate = useNavigate()
  const active = ui.status === 'running'

  useEffect(() => {
    if (!active) return
    return attachHandAim({ onSelect: (id) => navigate(`/projects/${id}`) })
  }, [active, navigate])

  if (!active) return null
  return <AimHud />
}

/**
 * Polls `hand`, `aim` and `focus` at display rate rather than subscribing.
 *
 * All three are read every frame by design (see gestures/store.ts and
 * projects/focus.ts) — putting a 22Hz stream through a reactive proxy is
 * exactly the re-render storm those splits exist to avoid. One rAF-driven
 * component reading them is cheap.
 */
function AimHud() {
  const [, force] = useState(0)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      force((n) => n + 1)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])

  const present = hand.present
  const project = getProject(focus.id ?? undefined)
  const pinching = hand.rawPose === 'pinch'

  return (
    <div className={`aim-hud${present ? ' is-live' : ''}`}>
      {present ? (
        <>
          {project && <span className="aim-hud__title">{project.title}</span>}
          <span className={`aim-hud__pinch${pinching ? ' is-pinching' : ''}`}>
            <i style={{ transform: `scaleX(${aim.progress})` }} />
          </span>
          <span className="aim-hud__hint">
            {pinching ? (
              'opening…'
            ) : project ? (
              <>
                <b>pinch</b> to open
              </>
            ) : (
              <>
                move to aim · <b>pinch</b> to open · <b>fist</b> to hold
              </>
            )}
          </span>
        </>
      ) : (
        <span className="aim-hud__hint">raise your hand into frame</span>
      )}
    </div>
  )
}
