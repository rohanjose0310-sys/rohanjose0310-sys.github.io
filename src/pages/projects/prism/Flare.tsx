import * as THREE from 'three'
import { forwardRef, useRef } from 'react'
import { useTexture, Instances, Instance } from '@react-three/drei'
import { useFrame, type ThreeElements } from '@react-three/fiber'

import streakTex from '../assets/lensflare/lensflare2.png'
import dotTex from '../assets/lensflare/lensflare3.png'
import glowTex from '../assets/lensflare/lensflare0_bw.png'

// Lens flare shown where the beam enters the prism.

type FlareProps = Omit<ThreeElements['group'], 'ref'> & {
  streak?: [number, number, number]
}

export const Flare = forwardRef<THREE.Group, FlareProps>(
  ({ streak = [8, 20, 1], visible, ...props }, fRef) => {
    const ref = useRef<THREE.Group>(null)
    const [streakTexture, dotTexture, glowTexture] = useTexture([streakTex, dotTex, glowTex])
    const config = {
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }

    useFrame((state) => {
      if (!ref.current) return
      ref.current.children.forEach((instance) => {
        const fx = instance.scale.x > 1 ? Math.sin : Math.cos
        const fy = instance.scale.x > 1 ? Math.cos : Math.atan
        instance.position.x = (fx((state.clock.elapsedTime * instance.scale.x) / 2) * instance.scale.x) / 8
        instance.position.y = (fy(state.clock.elapsedTime * instance.scale.x) * instance.scale.x) / 5
      })
    })

    return (
      <group ref={fRef} {...props} visible={visible} dispose={null}>
        <Instances frames={visible ? Infinity : 1}>
          <planeGeometry />
          <meshBasicMaterial map={dotTexture} {...config} />
          <group ref={ref}>
            <Instance scale={0.5} />
            <Instance scale={1.25} />
            <Instance scale={0.75} />
            <Instance scale={1.5} />
            <Instance scale={2} position={[0, 0, -0.7]} />
          </group>
        </Instances>
        <mesh scale={1}>
          <planeGeometry />
          <meshBasicMaterial map={glowTexture} {...config} opacity={1} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} scale={streak}>
          <planeGeometry />
          <meshBasicMaterial map={streakTexture} {...config} opacity={1} />
        </mesh>
      </group>
    )
  },
)
