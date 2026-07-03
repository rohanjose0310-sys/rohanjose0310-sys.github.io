import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// Parametric stand-ins with a CAD-part flavor, keyed by model id. Replaced by
// real .glb exports as they arrive. Geometries are module-level singletons —
// built once, shared across mounts.

function buildGear(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = []
  const body = new THREE.CylinderGeometry(1, 1, 0.3, 24)
  parts.push(body)
  const teeth = 10
  for (let i = 0; i < teeth; i++) {
    const tooth = new THREE.BoxGeometry(0.22, 0.3, 0.24)
    const angle = (i / teeth) * Math.PI * 2
    tooth.rotateY(angle)
    tooth.translate(Math.cos(angle) * 1.08, 0, Math.sin(angle) * 1.08)
    parts.push(tooth)
  }
  const hub = new THREE.CylinderGeometry(0.28, 0.28, 0.5, 16)
  parts.push(hub)
  const merged = mergeGeometries(parts)
  merged.rotateX(Math.PI / 2.5)
  return merged
}

function buildHousing(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = []
  const base = new THREE.BoxGeometry(2.2, 0.25, 1.4)
  base.translate(0, -0.6, 0)
  parts.push(base)
  const upright = new THREE.BoxGeometry(0.25, 1.2, 1.4)
  upright.translate(-0.85, 0.05, 0)
  parts.push(upright)
  const boss = new THREE.CylinderGeometry(0.45, 0.45, 0.35, 20)
  boss.rotateZ(Math.PI / 2)
  boss.translate(-0.55, 0.35, 0)
  parts.push(boss)
  return mergeGeometries(parts)
}

export const PLACEHOLDER_GEOMETRIES: Record<string, THREE.BufferGeometry> = {
  'torus-knot': new THREE.TorusKnotGeometry(0.9, 0.3, 96, 12),
  gear: buildGear(),
  capsule: new THREE.CapsuleGeometry(0.7, 1.1, 4, 16),
  housing: buildHousing(),
}
