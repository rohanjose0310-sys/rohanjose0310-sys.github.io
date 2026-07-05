// Shared pointer-drag state for the home carousel.
//
// Fiber connects its event system to the ScrollControls overlay div and sets
// touch-action: none on it, so native touch scrolling never happens on
// mobile — the wheel spins the carousel on desktop, but fingers do nothing.
// Instead of fighting that, swiping is implemented with pointer events
// (which fire fine on touch): written by <Rig>, read by <Banner> (wave
// speed) and <Card> (to suppress the click that fires after a swipe).
export const swipe = {
  /** Extra carousel rotation from dragging, in revolutions (1 = full spin). */
  offset: 0,
  /** Inertia after release, in revolutions per second. */
  velocity: 0,
  dragging: false,
  /** Pointer travel in px during the current/most recent drag. */
  travel: 0,
}
