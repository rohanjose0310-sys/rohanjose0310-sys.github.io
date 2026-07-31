import * as THREE from 'three'
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { aim } from '../aim'
import { claimHover, focus } from '../focus'
import { hitboxIdOf, hitboxTargets } from './hitboxes'
import { ndcToWorld } from './util'
import { hand } from '../../../gestures/store'

// The hand cursor: a reticle sitting exactly on the beam's origin, plus the
// direct-hover pick that the beam itself cannot do (see hitboxes.ts).
//
// In-canvas rather than a DOM overlay, because the cursor *is* the beam's
// origin — a light source in a scene whose entire look is bloom + LUT. A DOM
// overlay would sit on top of the composer output and be the one element on the
// page not passing through the grade, which reads as UI chrome pasted onto a
// light show.

/** World-space radius. Sized against the diamonds, which are 0.5 units across. */
const RADIUS = 0.34

/** Sits in front of the diamonds, which span z -0.25..0.25 under scale={0.5}. */
const CURSOR_Z = 1

const ACCENT = new THREE.Color('#ff6a00')
const WHITE = new THREE.Color('#ffffff')

// Never take a pointer. onPointerMissed on the Canvas is still the mouse's way
// into a project, and a mesh parked under the cursor would swallow every click.
// It carries no onRay* handlers either, so Reflect's isRayMesh already skips it
// and the beam cannot bounce off its own origin marker.
const NO_RAYCAST: THREE.Object3D['raycast'] = () => null

/** Reticle centre plus four rim points, as multiples of the reticle radius. */
const SAMPLES: Array<[number, number]> = [
  [0, 0],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

export function HandCursor() {
  const group = useRef<THREE.Group>(null)
  const ringMat = useRef<THREE.MeshBasicMaterial>(null)
  const dotMat = useRef<THREE.MeshBasicMaterial>(null)

  const [raycaster] = useState(() => new THREE.Raycaster())
  const [ndc] = useState(() => new THREE.Vector2())
  const [pos] = useState(() => new THREE.Vector3())
  const [tint] = useState(() => new THREE.Color())

  // Priority -1: this must land before PrismScene's resolveFocus() in the same
  // frame, and mount order must not be what decides that. Negative only —
  // @react-three/postprocessing's EffectComposer registers at priority 1 and
  // has taken over rendering, so any positive priority joins that takeover.
  useFrame((state) => {
    const g = group.current
    if (!g || !ringMat.current || !dotMat.current) return

    const active = aim.source === 'hand'
    g.visible = active
    if (!active) return

    // Sit exactly on the beam's origin, through the same helper PrismScene
    // uses for setRay so the two cannot drift apart.
    ndcToWorld(aim, state.viewport, pos)
    g.position.set(pos.x, pos.y, CURSOR_Z)

    // --- Direct hover ---
    //
    // Whoever owns the aim owns hoverClaim, so this writes every frame,
    // including null on a miss. Writing null is what clears a stale mouse
    // claim: if the physical cursor happened to be resting on a diamond when
    // hand mode started, hoverClaim would be stuck there — and since hover
    // outranks the beam in resolveFocus, the beam could never win focus again.
    const targets = hitboxTargets()
    let picked: string | null = null
    if (targets.length) {
      // Five rays: the reticle centre and four points on its rim. A diamond is
      // only ~30px at zoom 60, small for a hand, and this dilates the target
      // without inventing a tolerance constant — "the reticle overlaps the
      // diamond" is literally what it tests, so it can never disagree with
      // what the visitor can see.
      const rx = RADIUS / (state.viewport.width / 2)
      const ry = RADIUS / (state.viewport.height / 2)
      for (const [ox, oy] of SAMPLES) {
        ndc.set(aim.x + ox * rx, aim.y + oy * ry)
        raycaster.setFromCamera(ndc, state.camera)
        const hit = raycaster.intersectObjects(targets, false)[0]
        if (hit) {
          picked = hitboxIdOf(hit.object)
          break
        }
      }
    }
    claimHover(picked)

    // --- Appearance ---
    //
    // focus.id read straight off the proxy, not through useProxy: this wants
    // the value at frame time and has no reason to re-render the scene when it
    // changes. Same reasoning as ProjectsPage's openFocused.
    const focused = focus.id !== null
    tint.copy(focused ? ACCENT : WHITE)

    // Bloom runs at luminanceThreshold 1, so only colours brighter than white
    // glow at all. Driving that by scaling the colour past 1 is how the rest of
    // the page does it (Beam's opacity 1.5, Rainbow's emissiveIntensity 20).
    let gain = focused ? 2.4 : 0.6
    if (hand.rawPose === 'fist') gain = 0.4 // clutched: present but inert
    if (!aim.live) gain = 0.25 // hand out of frame
    gain += aim.progress * 2.5 // the commit lands as a flash

    ringMat.current.color.copy(tint).multiplyScalar(gain)
    dotMat.current.color.copy(tint).multiplyScalar(gain * 1.4)

    // Collapse onto the target as the pinch is accepted.
    g.scale.setScalar(1 - 0.45 * aim.progress)
  }, -1)

  return (
    <group ref={group} visible={false}>
      <mesh raycast={NO_RAYCAST}>
        <ringGeometry args={[RADIUS * 0.86, RADIUS, 48]} />
        <meshBasicMaterial ref={ringMat} transparent toneMapped={false} />
      </mesh>
      <mesh raycast={NO_RAYCAST}>
        <circleGeometry args={[RADIUS * 0.13, 24]} />
        <meshBasicMaterial ref={dotMat} transparent toneMapped={false} />
      </mesh>
    </group>
  )
}
