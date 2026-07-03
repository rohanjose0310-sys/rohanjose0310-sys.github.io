// DOM overlay over the home canvas. pointer-events: none so the 3D scene
// underneath still receives hover/click.
export function HeroText() {
  return (
    <div
      style={{
        position: 'fixed',
        top: '8%',
        left: 0,
        right: 0,
        textAlign: 'center',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <h1 style={{ margin: 0, fontSize: '2.6rem', letterSpacing: '-0.03em' }}>
        Rohan Jose <span style={{ color: 'var(--text)' }}>— Designer</span>
      </h1>
    </div>
  )
}
