import { proxy } from 'valtio'
import { useProxy } from 'valtio/utils'
import { DEBUG } from '../../lib/debug'

// Which project's hover card is showing on /projects. Exactly one, ever.
//
// The beam bounces through the scene once per frame and can graze *both*
// project diamonds in the same pass (Reflect.tsx's `update()` walks every
// bounce in order — see Reflect.tsx:115-136). Left alone, each ProjectBox
// would pop its own card independently and both would show at once. This
// arbiter picks a single winner per frame: direct cursor hover (a deliberate
// act) outranks the beam, and among beam claims the diamond struck FIRST
// leaving the cursor wins, because `createEvent` hands every RayEvent the
// full bounce-ordered `intersects` array (Reflect.tsx:58-70) — so
// `e.intersects.indexOf(e.intersect)` is a diamond's exact bounce index for
// free, with zero changes to Reflect.tsx.
//
// Split the same way gestures/store.ts splits `hand`/`handUI` (see the
// comment there): a plain object mutated every frame by the boxes'
// onRayMove/pointer handlers (up to 60x/sec, no render), and a valtio proxy
// that only gets written — and only re-renders — when the winner changes.
export const focus = proxy({ id: null as string | null })
export const useFocus = () => useProxy(focus)

// Same debugging affordance gestures/store.ts gives `hand`: aiming is hard to
// assert on from the outside without it, since the beam has no DOM surface.
// Dev only.
// Not `window.focus` — that's a native method, and shadowing it breaks
// anything that calls it.
if (DEBUG && typeof window !== 'undefined') {
  ;(window as unknown as { projectFocus: typeof focus }).projectFocus = focus
}

const beamClaims = new Map<string, number>() // projectId -> bounce index
let hoverClaim: string | null = null

export function claimBeam(id: string, order: number) {
  beamClaims.set(id, order)
}

export function releaseBeam(id: string) {
  beamClaims.delete(id)
}

export function claimHover(id: string | null) {
  hoverClaim = id
}

/**
 * Drop every claim. Call on scene teardown.
 *
 * Both claim channels are module singletons, and a beam claim can *only* be
 * released by `onRayOut` — which needs 3 consecutive misses (Reflect.tsx's
 * MISS_TOLERANCE) and is never fired on unmount, because the Reflect api is
 * simply discarded. So without this, aiming at a diamond and opening it leaves
 * that claim behind forever: on return, the first resolveFocus() picks it up
 * before a single ray has run, and the page opens with a card already showing
 * on a diamond nobody is aiming at. The new Reflect has a fresh `hits` map, so
 * no onRayOut can ever fire for the orphan and it never clears itself.
 */
export function resetClaims() {
  beamClaims.clear()
  hoverClaim = null
  focus.id = null
}

export function resolveFocus() {
  // Direct hover is a deliberate act and outranks the beam. Otherwise the
  // diamond the beam strikes FIRST from the cursor wins — that's what the
  // beam is aiming at; later bounces still glow (each ProjectBox keeps its
  // own unarbitrated rayHit/hovered for that) but don't claim the card.
  let winner = hoverClaim
  if (!winner && beamClaims.size) {
    let best = Infinity
    beamClaims.forEach((order, id) => {
      if (order < best) {
        best = order
        winner = id
      }
    })
  }
  // Live, deliberately NOT latched. An earlier version kept the card up after
  // the beam left so the cursor could travel to a button on it — but the
  // cursor *is* the beam source, so that trip re-aims the beam, and on the way
  // to Dream Parasite's card (offset right) the beam swept across the Exiled
  // diamond, which then won focus and replaced the card mid-journey. Nothing
  // has to be travelled to now: the card is a readout of what the beam is on,
  // and a click opens whatever that is. See ProjectsPage's onPointerMissed.
  //
  // Writing to the proxy only on an actual change is what keeps this from
  // becoming a per-frame re-render storm.
  const next = winner ?? null
  if (next !== focus.id) focus.id = next
}
