import type { CSSProperties } from 'react'
import { useLocation } from 'react-router-dom'

// Pages with a light backdrop get the black mark; dark pages (Projects'
// black canvas, Resume's placeholder on the dark global --bg) get white.
const DARK_BACKDROP_ROUTES = ['/projects', '/resume']

// Routes that place the mark inline themselves — next to "Rohan Jose" (see
// HeroText, ContactPage, models/Overlay), or below the back button on About
// (see about/AboutPage's AdaptiveMark usage) — the corner-fixed <Logo/> below
// stays out of the way on those routes.
const INLINE_MARK_ROUTES = ['/', '/contact', '/models', '/about']

// Aspect ratio of the source PNGs (225x74 / 226x74) — used to size the
// two-image stack in AdaptiveMark without waiting on image load.
const LOGO_ASPECT = 225.5 / 74

function useLogoSrc() {
  const { pathname } = useLocation()
  return DARK_BACKDROP_ROUTES.includes(pathname) ? '/logo-white.png' : '/logo-black.png'
}

// Bare brand mark, sized by the caller. Meant to sit directly beside a "Rohan
// Jose" text block — see the pages listed in INLINE_MARK_ROUTES for usage.
export function BrandMark({ height, style }: { height: number; style?: CSSProperties }) {
  const src = useLogoSrc()
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      style={{ height, width: 'auto', display: 'block', flexShrink: 0, ...style }}
    />
  )
}

// Two-image stack whose opacity crossfades between the black and white mark
// via the `--about-logo-ink` CSS var (0 = black, 1 = white), set per-frame
// from a luminance readback of the About page's scene buffer (see LensScene
// bufferLuma). Plain opacity crossfades fine over a WebGL canvas in Safari —
// unlike mix-blend-mode, which doesn't (see memory safari-blend-over-webgl).
export function AdaptiveMark({ height, style }: { height: number; style?: CSSProperties }) {
  const imgStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    height: '100%',
    width: '100%',
    transition: 'opacity 0.25s ease',
  }
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        height,
        width: height * LOGO_ASPECT,
        flexShrink: 0,
        ...style,
      }}
    >
      <img
        src="/logo-black.png"
        alt=""
        aria-hidden="true"
        style={{ ...imgStyle, opacity: 'calc(1 - var(--about-logo-ink, 0))' }}
      />
      <img
        src="/logo-white.png"
        alt=""
        aria-hidden="true"
        style={{ ...imgStyle, opacity: 'var(--about-logo-ink, 0)' }}
      />
    </span>
  )
}

// Fixed corner mark for pages with no adjacent name text (Projects, Resume).
// Color is chosen per-route rather than via mix-blend-mode: blend modes
// don't composite over a WebGL canvas in iOS Safari (see memory
// safari-blend-over-webgl), and both pages have one known, static backdrop
// color rather than a multi-toned scroll.
export function Logo() {
  const { pathname } = useLocation()
  if (INLINE_MARK_ROUTES.includes(pathname)) return null

  return (
    <BrandMark
      height={22}
      style={{
        position: 'fixed',
        left: '1.75rem',
        bottom: '1.75rem',
        zIndex: 50,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    />
  )
}
