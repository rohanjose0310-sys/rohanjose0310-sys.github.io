import type * as THREE from 'three'

// Which invisible hitbox belongs to which project, for the hand cursor's own
// raycast.
//
// The beam cannot answer "is the cursor ON this diamond". Its ray starts AT the
// cursor and runs toward the world origin, so a cursor sitting on a diamond
// starts the ray *inside* the hitbox — and a FrontSide raycast does not hit
// back faces, so the diamond is simply missed. Direct hover therefore needs its
// own pick.
//
// It picks against exactly the same invisible BoxGeometry the real mouse hits,
// through the same Mesh.raycast, so hand hover and mouse hover agree by
// construction and keep agreeing if a diamond ever moves.

const boxes = new Map<string, THREE.Object3D>()

/** Register a project's hitbox. Returns the unregister fn for effect cleanup. */
export function registerHitbox(id: string, object: THREE.Object3D): () => void {
  boxes.set(id, object)
  return () => {
    // Guard on identity: on a fast remount the replacement may already have
    // claimed the slot, and deleting it would silently kill direct hover.
    if (boxes.get(id) === object) boxes.delete(id)
  }
}

/**
 * The registered hitboxes, as a raycast target list.
 *
 * Returns a reused array — this is read every frame, and the caller hands it
 * straight to Raycaster.intersectObjects, which doesn't retain it. Treat it as
 * valid only until the next call.
 */
const targets: THREE.Object3D[] = []
export function hitboxTargets(): THREE.Object3D[] {
  targets.length = 0
  for (const object of boxes.values()) targets.push(object)
  return targets
}

/** Which project a raycast hit belongs to, or null if it isn't a hitbox. */
export function hitboxIdOf(object: THREE.Object3D): string | null {
  for (const [id, candidate] of boxes) {
    if (candidate === object) return id
  }
  return null
}
