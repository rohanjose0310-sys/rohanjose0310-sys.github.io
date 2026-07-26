// Where a scroll gesture's output goes.
//
// Scroll targets differ per page — most pages scroll the window, but the About
// page scrolls a drei ScrollControls element that only exists inside its Canvas.
// So the gesture emitter stays page-agnostic: it just calls emitScroll(delta),
// and whichever page is on screen decides what that means by registering a sink.
//
// delta is in normalized units: 1.0 ≈ one viewport height of scroll.

export type ScrollSink = (deltaNormalized: number) => void

const defaultSink: ScrollSink = (d) => {
  if (typeof window !== 'undefined') window.scrollBy(0, d * window.innerHeight)
}

let sink: ScrollSink = defaultSink

/**
 * Take over scroll delivery for the current page. Returns an unregister that
 * restores the window-scroll default — call it on unmount, or a stale page's
 * sink keeps receiving scrolls after you leave it.
 */
export function registerScrollSink(s: ScrollSink): () => void {
  sink = s
  return () => {
    if (sink === s) sink = defaultSink
  }
}

export function emitScroll(deltaNormalized: number) {
  sink(deltaNormalized)
}
