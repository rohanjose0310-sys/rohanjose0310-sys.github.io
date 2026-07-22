import { useLocation } from 'react-router-dom'
import { IS_TOUCH } from '../../lib/touch'
import { pageTint } from '../../lib/pageTheme'

// Hands iOS 26 Safari the colour for its status bar and toolbar, per route.
//
// Safari tints those bars from the background-color of the topmost fixed
// element flush with each viewport edge, falling back to <body> — which it
// reads only at first paint (see index.html). Mounting a fixed element is the
// one signal it still acts on afterwards, so these two strips are the live
// channel: `key={pathname}` tears them down and re-inserts them on every
// navigation, because a fresh insert re-tints where restyling in place does not.
//
// 8px clears the ~6px minimum Safari needs to accept a strip as a candidate,
// while staying well inside the status bar / home indicator areas — Safari's
// own chrome covers them, so they are never visible on the page. The z-index
// keeps them above every page layer for the same reason: Safari picks the
// topmost candidate at each edge, and the pages stack fixed backdrops of their
// own. Touch only; desktop Safari has no such bars.
export function BarTint() {
  const { pathname } = useLocation()
  const tint = pageTint(pathname)
  if (!IS_TOUCH || !tint) return null
  return (
    <div key={pathname} aria-hidden="true">
      <span className="bar-tint top" style={{ background: tint.top }} />
      <span className="bar-tint bottom" style={{ background: tint.bottom }} />
    </div>
  )
}
