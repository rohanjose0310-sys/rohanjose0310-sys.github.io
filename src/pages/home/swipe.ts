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
}
