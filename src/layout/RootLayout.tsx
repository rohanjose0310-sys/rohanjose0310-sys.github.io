import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Leva } from 'leva'
import { DEBUG } from '../lib/debug'
import { useLenis } from '../lib/lenis'
import { Logo } from '../components/ui/Logo'

declare global {
  interface Window {
    /** Defined by the inline script in index.html. */
    __pageTheme?: (path: string) => void
  }
}

// Persistent app chrome: one Lenis smooth-scroll instance for the whole app;
// pages render through <Outlet/>. Lenis is disabled on routes that scroll via
// drei ScrollControls (home carousel, about lens), which Lenis would block.
const SCROLLCONTROLS_ROUTES = ['/', '/about']

export function RootLayout() {
  const { pathname } = useLocation()
  useLenis(!SCROLLCONTROLS_ROUTES.includes(pathname))
  // Deep links 404 on GitHub Pages (BrowserRouter, no 404.html), so every route
  // past the first is reached by client-side navigation — index.html's one-shot
  // call would otherwise leave the whole site on the entry route's colour.
  useEffect(() => {
    window.__pageTheme?.(pathname)
  }, [pathname])
  return (
    <>
      <Leva hidden={!DEBUG} collapsed />
      <Logo />
      <Outlet />
    </>
  )
}
