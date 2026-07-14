import { Outlet, useLocation } from 'react-router-dom'
import { Leva } from 'leva'
import { DEBUG } from '../lib/debug'
import { useLenis } from '../lib/lenis'

// Persistent app chrome: one Lenis smooth-scroll instance for the whole app;
// pages render through <Outlet/>. Lenis is disabled on routes that scroll via
// drei ScrollControls (home carousel, about lens), which Lenis would block.
const SCROLLCONTROLS_ROUTES = ['/', '/about']

export function RootLayout() {
  const { pathname } = useLocation()
  useLenis(!SCROLLCONTROLS_ROUTES.includes(pathname))
  return (
    <>
      <Leva hidden={!DEBUG} collapsed />
      <Outlet />
    </>
  )
}
