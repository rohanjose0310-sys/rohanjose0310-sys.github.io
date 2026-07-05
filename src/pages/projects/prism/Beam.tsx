import * as THREE from 'three'
import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { Reflect, type ReflectApi } from './Reflect'

import streakTex from '../assets/lensflare/lensflare2.png'
import glowTex from '../assets/lensflare/lensflare0_bw.jpg'

// The visible light beam: instanced streak + glow planes laid along the
// segments computed by <Reflect>.

interface BeamProps {
  children?: ReactNode
  position?: [number, number, number]
  stride?: number
  width?: number
  bounce?: number
  far?: number
}

export const Beam = forwardRef<ReflectApi, BeamProps>(
  ({ children, position, stride = 4, width = 8, ...props }, fRef) => {
    const streaks = useRef<THREE.InstancedMesh>(null)
    const glow = useRef<THREE.InstancedMesh>(null)
    const reflect = useRef<ReflectApi>(null)
    const [streakTexture, glowTexture] = useTexture([streakTex, glowTex])

    const obj = new THREE.Object3D()
    const f = new THREE.Vector3()
    const t = new THREE.Vector3()
    const n = new THREE.Vector3()
    const config = {
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }

    useLayoutEffect(() => {
      streaks.current!.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
      glow.current!.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    }, [])

    useFrame(() => {
      if (!reflect.current || !streaks.current || !glow.current) return
      const range = reflect.current.update() - 1

      for (let i = 0; i < range; i++) {
        // Segment start and end
        f.fromArray(reflect.current.positions, i * 3)
        t.fromArray(reflect.current.positions, i * 3 + 3)
        // Normal along the segment
        n.subVectors(t, f).normalize()
        // Mid-point, stretched by segment length
        obj.position.addVectors(f, t).divideScalar(2)
        obj.scale.set(t.distanceTo(f) * stride, width, 1)
        obj.rotation.set(0, 0, Math.atan2(n.y, n.x))
        obj.updateMatrix()
        streaks.current.setMatrixAt(i, obj.matrix)
      }

      streaks.current.count = range
      streaks.current.instanceMatrix.needsUpdate = true

      // First glow isn't shown
      obj.scale.setScalar(0)
      obj.updateMatrix()
      glow.current.setMatrixAt(0, obj.matrix)

      for (let i = 1; i < range; i++) {
        obj.position.fromArray(reflect.current.positions, i * 3)
        obj.scale.setScalar(0.75)
        obj.rotation.set(0, 0, 0)
        obj.updateMatrix()
        glow.current.setMatrixAt(i, obj.matrix)
      }

      glow.current.count = range
      glow.current.instanceMatrix.needsUpdate = true
    })

    useImperativeHandle(fRef, () => reflect.current!, [])

    return (
      <group position={position}>
        <Reflect {...props} ref={reflect}>
          {children}
        </Reflect>
        <instancedMesh ref={streaks} args={[undefined, undefined, 100]}>
          <planeGeometry />
          <meshBasicMaterial map={streakTexture} opacity={1.5} {...config} transparent={false} />
        </instancedMesh>
        <instancedMesh ref={glow} args={[undefined, undefined, 100]}>
          <planeGeometry />
          <meshBasicMaterial map={glowTexture} {...config} />
        </instancedMesh>
      </group>
    )
  },
)
