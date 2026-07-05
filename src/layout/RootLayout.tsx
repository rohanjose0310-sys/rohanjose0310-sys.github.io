import { Outlet, useLocation } from 'react-router-dom'
import { Leva } from 'leva'
import { DEBUG } from '../lib/debug'
import { useLenis } from '../lib/lenis'

// Persistent app chrome: one Lenis smooth-scroll instance for the whole app;
// pages render through <Outlet/>. Lenis is disabled on the home route — its
// carousel scrolls via drei ScrollControls, which Lenis would block.
export function RootLayout() {
  const { pathname } = useLocation()
  useLenis(pathname !== '/')
  return (
    <>
      <Leva hidden={!DEBUG} collapsed />
      <Outlet />
    </>
  )
}
