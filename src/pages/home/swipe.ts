// Shared pointer-drag state for the home carousel.
//
// The ScrollControls overlay div is a *real* native scroller (drei gives it
// overflow-y: auto, and fiber's connect() only adds listeners — it never sets
// touch-action). On desktop that's fine: the wheel drives ScrollControls and a
// mouse drag adds to it. On touch it meant two things fought over one finger,
// so <CardScene> hands ScrollControls `overflow: hidden` + `touch-action:
// none` on touch devices and the drag handler owns the gesture outright.
//
// Written by <Rig>; read by <Banner> (wave speed) and <Card> (to suppress the
// click that fires after a swipe).
export const swipe = {
  /** Extra carousel rotation from dragging, in revolutions (1 = full spin). */
  offset: 0,
  /** Inertia after release, in revolutions per second. */
  velocity: 0,
  dragging: false,
  /** Pointer travel in px during the current/most recent drag. */
  travel: 0,
  /** Revolutions the carousel actually turned last frame, from all inputs. */
  delta: 0,
  /**
   * ScrollControls' contribution to the rotation, published by <Rig>.
   *
   * Only this half is republished, rather than the combined rotation: it is the
   * half that lives inside drei's ScrollControls context and so can't be read
   * from outside the Canvas. Deliberately *not* the total — that would make the
   * hand controller's idea of "which card is in front" depend on <Rig> having
   * rendered a frame, and a stalled frameloop would then make a pinch navigate
   * to the wrong card. Composing it with the live `offset` instead keeps the
   * hand-driven half always current.
   */
  scrollOffset: 0,
}

/**
 * The carousel's current rotation in revolutions, from all inputs combined.
 * Mirrors the calculation in <Rig>, which owns the authoritative version.
 */
export function currentTurns(): number {
  return swipe.offset - swipe.scrollOffset
}

// Dev-only handle for console poking and automated checks, matching the one
// gestures/store.ts exposes for `hand`.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as { swipe: typeof swipe }).swipe = swipe
}
