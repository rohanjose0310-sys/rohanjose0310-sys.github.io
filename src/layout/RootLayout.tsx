import { Outlet } from 'react-router-dom'
import { Leva } from 'leva'
import { DEBUG } from '../lib/debug'

// Persistent app chrome. Lenis smooth-scroll gets wired here later;
// pages render through <Outlet/>.
export function RootLayout() {
  return (
    <>
      <Leva hidden={!DEBUG} collapsed />
      <Outlet />
    </>
  )
}
