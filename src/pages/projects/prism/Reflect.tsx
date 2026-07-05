import * as THREE from 'three'
import { forwardRef, useRef, useMemo, useLayoutEffect, useImperativeHandle } from 'react'
import { invalidate, type ThreeElements } from '@react-three/fiber'

// Port of the pmndrs nextjs-prism Reflect: a CPU raycast that bounces a ray
// through the scene and calls onRayOver/onRayOut/onRayMove on hit meshes.

export interface RayIntersection extends THREE.Intersection {
  direction?: THREE.Vector3
  reflect?: THREE.Vector3
}

interface RayHit {
  key: string
  intersect: RayIntersection
  stopped: boolean
}

export interface ReflectApi {
  number: number
  objects: THREE.Object3D[]
  hits: Map<string, RayHit>
  start: THREE.Vector3
  end: THREE.Vector3
  raycaster: THREE.Raycaster
  positions: Float32Array
  setRay: (start?: [number, number, number], end?: [number, number, number]) => void
  update: () => number
}

export interface RayEvent {
  api: ReflectApi
  object: THREE.Object3D
  position: THREE.Vector3
  direction?: THREE.Vector3
  reflect?: THREE.Vector3
  normal?: THREE.Vector3
  intersect: RayIntersection
  intersects: RayIntersection[]
  stopPropagation: () => void
}

export interface RayHandlers {
  onRayOver?: (event: RayEvent) => void
  onRayOut?: (event: RayEvent) => void
  onRayMove?: (event: RayEvent) => void
}

type RayMesh = THREE.Mesh & RayHandlers

function isRayMesh(object: THREE.Object3D): object is RayMesh {
  const mesh = object as RayMesh
  return mesh.isMesh && Boolean(mesh.onRayOver || mesh.onRayOut || mesh.onRayMove)
}

function createEvent(api: ReflectApi, hit: RayHit, intersect: RayIntersection, intersects: RayIntersection[]): RayEvent {
  return {
    api,
    object: intersect.object,
    position: intersect.point,
    direction: intersect.direction,
    reflect: intersect.reflect,
    normal: intersect.face?.normal,
    intersect,
    intersects,
    stopPropagation: () => (hit.stopped = true),
  }
}

export type ReflectProps = Omit<ThreeElements['group'], 'ref'> & {
  start?: [number, number, number]
  end?: [number, number, number]
  bounce?: number
  far?: number
}

export const Reflect = forwardRef<ReflectApi, ReflectProps>(
  ({ children, start: _start = [0, 0, 0], end: _end = [0, 0, 0], bounce = 10, far = 100, ...props }, fRef) => {
    const scene = useRef<THREE.Group>(null)
    const maxBounce = (bounce || 1) + 1

    const api = useMemo<ReflectApi>(() => {
      const vStart = new THREE.Vector3()
      const vEnd = new THREE.Vector3()
      const vDir = new THREE.Vector3()
      const vPos = new THREE.Vector3()
      let intersect: RayIntersection | undefined
      let intersects: RayIntersection[] = []

      const self: ReflectApi = {
        number: 0,
        objects: [],
        hits: new Map(),
        start: new THREE.Vector3(),
        end: new THREE.Vector3(),
        raycaster: new THREE.Raycaster(),
        positions: new Float32Array(Array.from({ length: (maxBounce + 10) * 3 }, () => 0)),
        setRay: (start = [0, 0, 0], end = [0, 0, 0]) => {
          self.start.set(...start)
          self.end.set(...end)
        },
        update: () => {
          self.number = 0
          intersects = []

          vStart.copy(self.start)
          vEnd.copy(self.end)
          vDir.subVectors(vEnd, vStart).normalize()
          vStart.toArray(self.positions, self.number++ * 3)

          // Run a full cycle until bounces run out or the ray points into nothing.
          // This is necessary for over/out hit-testing.
          while (true) {
            self.raycaster.set(vStart, vDir)
            intersect = self.raycaster.intersectObjects(self.objects, false)[0] as RayIntersection | undefined
            if (self.number < maxBounce && intersect && intersect.face) {
              intersects.push(intersect)
              intersect.direction = vDir.clone()
              // Something was hit and we still haven't met the bounce limit
              intersect.point.toArray(self.positions, self.number++ * 3)
              vDir.reflect(
                intersect.object
                  .localToWorld(intersect.face.normal)
                  .sub(intersect.object.getWorldPosition(vPos))
                  .normalize(),
              )
              intersect.reflect = vDir.clone()
              vStart.copy(intersect.point)
            } else {
              // Nothing was hit and the ray extends into "infinity" (dir * far)
              vEnd.addVectors(vStart, vDir.multiplyScalar(far)).toArray(self.positions, self.number++ * 3)
              break
            }
          }

          // Reset and count up once again
          self.number = 1
          // Check onRayOut: if a previous hit is no longer among the intersects
          self.hits.forEach((hit) => {
            if (!intersects.find((intersect) => intersect.object.uuid === hit.key)) {
              self.hits.delete(hit.key)
              const object = hit.intersect.object as RayMesh
              if (object.onRayOut) {
                invalidate()
                object.onRayOut(createEvent(self, hit, hit.intersect, intersects))
              }
            }
          })

          // Check onRayOver
          for (intersect of intersects) {
            self.number++
            if (!self.hits.has(intersect.object.uuid)) {
              const hit: RayHit = { key: intersect.object.uuid, intersect, stopped: false }
              self.hits.set(intersect.object.uuid, hit)
              const object = intersect.object as RayMesh
              if (object.onRayOver) {
                invalidate()
                object.onRayOver(createEvent(self, hit, intersect, intersects))
              }
            }

            const hit = self.hits.get(intersect.object.uuid)!
            const object = intersect.object as RayMesh
            if (object.onRayMove) {
              invalidate()
              object.onRayMove(createEvent(self, hit, intersect, intersects))
            }

            // If the hit was stopped (stopPropagation) interrupt the loop
            if (hit.stopped) break
            // At the last hit, an unstopped ray goes into the infinite
            if (intersect === intersects[intersects.length - 1]) self.number++
          }
          return Math.max(2, self.number)
        },
      }
      return self
    }, [maxBounce, far])

    useLayoutEffect(() => void api.setRay(_start, _end), [api, _start, _end])
    useImperativeHandle(fRef, () => api, [api])

    useLayoutEffect(() => {
      // Collect all objects that fulfill the ray-mesh criteria
      api.objects = []
      scene.current!.traverse((object) => {
        if (isRayMesh(object)) api.objects.push(object)
      })
      // Calculate world matrices at least once before raycasting starts
      scene.current!.updateWorldMatrix(true, true)
    })

    return (
      <group ref={scene} {...props}>
        {children}
      </group>
    )
  },
)
