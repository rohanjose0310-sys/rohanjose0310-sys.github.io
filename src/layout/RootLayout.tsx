import { Outlet } from 'react-router-dom'
import { Leva } from 'leva'
import { DEBUG } from '../lib/debug'
import { useLenis } from '../lib/lenis'

// Persistent app chrome: one Lenis smooth-scroll instance for the whole app;
// pages render through <Outlet/>.
export function RootLayout() {
  useLenis()
  return (
    <>
      <Leva hidden={!DEBUG} collapsed />
      <Outlet />
    </>
  )
}
