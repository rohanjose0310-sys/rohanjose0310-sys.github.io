import * as THREE from 'three'
import type { RayHandlers } from './Reflect'

export function lerp<K extends string>(object: Record<K, number>, prop: K, goal: number, speed = 0.1) {
  object[prop] = THREE.MathUtils.lerp(object[prop], goal, speed)
}

const color = new THREE.Color()
export function lerpC(value: THREE.Color, goal: THREE.ColorRepresentation, speed = 0.1) {
  value.lerp(color.set(goal), speed)
}

const vector = new THREE.Vector3()
export function lerpV3(value: THREE.Vector3, goal: [number, number, number], speed = 0.1) {
  value.lerp(vector.set(...goal), speed)
}

/**
 * NDC (-1..1, y up) to world space on the z=0 plane, for this page's
 * orthographic camera.
 *
 * The beam's origin and the hand cursor have to land on exactly the same point
 * — the cursor *is* the beam's origin — so both go through here rather than
 * repeating the expression. FitZoom rewrites the camera zoom per frame, so
 * `viewport` must be the live one off the frame state, never a captured value.
 */
export function ndcToWorld(
  ndc: { x: number; y: number },
  viewport: { width: number; height: number },
  out: THREE.Vector3,
): THREE.Vector3 {
  return out.set((ndc.x * viewport.width) / 2, (ndc.y * viewport.height) / 2, 0)
}

export function calculateRefractionAngle(incidentAngle: number, glassIor = 2.5, airIor = 1.000293) {
  const theta = Math.asin((airIor * Math.sin(incidentAngle)) / glassIor) || 0
  return theta
}

// The Reflect raycaster reads onRayOver/onRayOut/onRayMove straight off mesh
// objects — fiber assigns unknown JSX props to the instance, but TS doesn't
// know them, so route them through an untyped spread.
export function rayProps(handlers: RayHandlers): Record<string, unknown> {
  return { ...handlers }
}
