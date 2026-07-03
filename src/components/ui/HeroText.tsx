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
      <h1
        style={{
          position: 'absolute',
          top: 40,
          left: 40,
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
      <div
        style={{
          position: 'absolute',
          bottom: 40,
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
