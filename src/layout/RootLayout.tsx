import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Leva } from 'leva'
import { DEBUG } from '../lib/debug'
import { useLenis } from '../lib/lenis'
import { Logo } from '../components/ui/Logo'
import { BarTint } from '../components/ui/BarTint'
import { applyPageTheme } from '../lib/pageTheme'

// Persistent app chrome: one Lenis smooth-scroll instance for the whole app;
// pages render through <Outlet/>. Lenis is disabled on routes that scroll via
// drei ScrollControls (home carousel, about lens), which Lenis would block.
const SCROLLCONTROLS_ROUTES = ['/', '/about']

export function RootLayout() {
  const { pathname } = useLocation()
  useLenis(!SCROLLCONTROLS_ROUTES.includes(pathname))
  // Keeps <body> and color-scheme on the current route. This does NOT re-tint
  // Safari's bars — it ignores post-first-paint changes to body — so it only
  // has to be right for what the page itself paints; <BarTint> handles the bars.
  useEffect(() => {
    applyPageTheme(pathname)
  }, [pathname])
  return (
    <>
      <Leva hidden={!DEBUG} collapsed />
      <BarTint />
      <Logo />
      <Outlet />
    </>
  )
}
