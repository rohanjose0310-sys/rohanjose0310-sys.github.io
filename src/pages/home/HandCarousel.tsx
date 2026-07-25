// Hand control for the home carousel, plus the on-screen affordance for it.
//
// The HUD is not decoration. Gestures have no discoverable surface — no cursor
// to hover, no button to see — so the only way a visitor learns what their hand
// does is to be told, and the only way they trust a pinch is to watch it commit.
// It names the card that a pinch would take and fills a bar as the pinch is
// being accepted.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hand, useHandUI } from '../../gestures/store'
import { CARDS } from './cardData'
import { currentTurns } from './swipe'
import { attachHandCarousel, frontCardIndex } from './carouselControl'
import './handHud.css'

export function HandCarousel() {
  const ui = useHandUI()
  const navigate = useNavigate()
  const active = ui.status === 'running'

  useEffect(() => {
    if (!active) return
    return attachHandCarousel({ onSelect: (route) => navigate(route) })
  }, [active, navigate])

  if (!active) return null
  return <HandHud />
}

/**
 * Polls `hand` and `swipe` at display rate rather than subscribing to them.
 *
 * Both are plain mutable objects on purpose (see gestures/store.ts) — putting a
 * 22Hz landmark stream through a reactive proxy is exactly the re-render storm
 * that design avoids. A single rAF-driven component reading them is cheap.
 */
function HandHud() {
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
  const card = CARDS[frontCardIndex(currentTurns())]
  const pinching = hand.rawPose === 'pinch'
  // Committed pinch reads as 100% even after poseProgress has been overtaken by
  // the next pose, so the bar never appears to fall back at the moment it fires.
  const progress = hand.pose === 'pinch' ? 1 : pinching ? hand.poseProgress : 0

  return (
    <div className={`hand-hud${present ? ' is-live' : ''}`}>
      {present ? (
        <>
          <span className="hand-hud__card">{card.label}</span>
          <span className={`hand-hud__pinch${pinching ? ' is-pinching' : ''}`}>
            <i style={{ transform: `scaleX(${progress})` }} />
          </span>
          <span className="hand-hud__hint">
            {pinching ? 'entering…' : 'move to turn · pinch to enter · fist to hold'}
          </span>
        </>
      ) : (
        <span className="hand-hud__hint">raise your hand into frame</span>
      )}
    </div>
  )
}
