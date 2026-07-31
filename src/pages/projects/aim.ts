// Where the beam is aimed, and who is aiming it.
//
// The prism scene's entire input is one point: PrismScene converts an NDC
// coordinate to world space and hands it to Reflect as the beam's origin. So
// mouse and hand don't need separate paths through the scene — they only need
// to agree on that one point, which is what this module is.
//
// Hot mutable, no valtio: read every frame, for the same reason
// gestures/store.ts keeps `hand` plain and pages/home/swipe.ts keeps `swipe`
// plain — a value changing 60x a second inside a proxy is a re-render storm.

export type AimSource = 'mouse' | 'hand'

export const aim = {
  /** NDC, -1..1, y UP — the exact space state.pointer uses. */
  x: 0,
  y: 0,
  /**
   * Who owns the aim point. 'mouse' means: defer to state.pointer entirely.
   *
   * The mouse deliberately does NOT write into `aim`. Its path through the
   * scene already works and is load-bearing (onPointerMissed -> openFocused,
   * onPointerOver -> claimHover), so routing it through here would put a new
   * failure mode in front of working behaviour for no gain. While nothing has
   * taken over, `aimNdc` hands back state.pointer untouched and the page
   * behaves exactly as it did before hand control existed.
   */
  source: 'mouse' as AimSource,
  /** Mirrors hand.present — the reticle dims when the hand leaves frame. */
  live: false,
  /** 0..1 toward a pinch commit. Drives the reticle's collapse. */
  progress: 0,
}

// Same debugging affordance gestures/store.ts gives `hand`. Aiming has no DOM
// surface to assert on, so without this it can only be checked by eye.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as { aim: typeof aim }).aim = aim
}

/** The beam's origin in NDC. Falls through to the mouse unless a hand took over. */
export function aimNdc(pointer: { x: number; y: number }): { x: number; y: number } {
  return aim.source === 'hand' ? aim : pointer
}

/**
 * Switch owner, and hide the OS cursor while the hand holds the aim.
 *
 * index.css paints an orange dot cursor on <body> site-wide; in hand mode it
 * sits frozen wherever the mouse was last left, competing with the reticle for
 * "which of these is the pointer". Same per-page override precedent as
 * models.css. Guarded on change so this is not a classList write every frame.
 */
export function setAimSource(source: AimSource) {
  if (aim.source === source) return
  aim.source = source
  document.documentElement.classList.toggle('hand-aim', source === 'hand')
}
