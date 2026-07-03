import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CameraRigProps {
  /** How far the camera drifts with the pointer, in world units. */
  strength?: [x: number, y: number]
}

// Subtle pointer-follow parallax: lerps the camera toward the pointer and
// keeps it looking at the origin. Reusable by any 3D page.
export function CameraRig({ strength = [0.4, 0.2] }: CameraRigProps) {
  const target = useRef(new THREE.Vector3())

  useFrame(({ camera, pointer }) => {
    target.current.set(pointer.x * strength[0], 0.4 + pointer.y * strength[1], camera.position.z)
    camera.position.lerp(target.current, 0.04)
    camera.lookAt(0, 0, 0)
  })

  return null
}
