import { BrandMark } from './Logo'

// DOM overlay over the home canvas, styled after the demo's minimal corner
// labels (dark text on the light dawn background). pointer-events: none so
// the 3D scene underneath still receives hover/click/scroll.
export function HeroText() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        color: '#111',
      }}
    >
      <div
        style={{
          position: 'absolute',
          // env() is 0 outside viewport-fit=cover contexts (desktop included);
          // on iOS it keeps the title clear of the status bar / Dynamic Island
          top: 'calc(40px + env(safe-area-inset-top))',
          left: 40,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
        }}
      >
        <BrandMark height={27} />
        <h1
          style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: '#111',
          }}
        >
          Rohan Jose
          <br />
          <span style={{ fontWeight: 400, opacity: 0.65 }}>Designer</span>
        </h1>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(40px + env(safe-area-inset-bottom))',
          left: 40,
          fontSize: '13px',
          opacity: 0.65,
        }}
      >
        scroll to browse — click a card to enter
      </div>
    </div>
  )
}
