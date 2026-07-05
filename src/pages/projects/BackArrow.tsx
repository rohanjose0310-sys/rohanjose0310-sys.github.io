import * as THREE from 'three'
import { useRef, useState, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useNavigate } from 'react-router-dom'
import { easing } from 'maath'
import type { RainbowMaterialImpl } from './prism/Rainbow'

// In-scene back button: a thick extruded ← in the top-left corner, same
// white standard material as the "My Projects" caption. Its point light
// follows the rainbow's intensity, so it emerges from the dark with the
// caption when the prism fires (the scene spotlight can't reach the corner).

const arrow = new THREE.Shape()
arrow.moveTo(-0.5, 0) // tip
arrow.lineTo(-0.14, 0.3)
arrow.lineTo(-0.14, 0.1)
arrow.lineTo(0.5, 0.1)
arrow.lineTo(0.5, -0.1)
arrow.lineTo(-0.14, -0.1)
arrow.lineTo(-0.14, -0.3)
arrow.closePath()

const arrowGeometry = new THREE.ExtrudeGeometry(arrow, {
  depth: 0.06,
  bevelEnabled: true,
  bevelThickness: 0.02,
  bevelSize: 0.02,
  bevelSegments: 2,
})

export function BackArrow({ rainbow }: { rainbow: RefObject<THREE.Mesh | null> }) {
  const { width, height } = useThree((state) => state.viewport)
  const group = useRef<THREE.Group>(null)
  const light = useRef<THREE.PointLight>(null)
  const [hovered, hover] = useState(false)
  const navigate = useNavigate()

  useFrame((_state, delta) => {
    if (!group.current || !light.current) return
    const material = rainbow.current?.material as RainbowMaterialImpl | undefined
    // Track the caption's reveal; hover makes it readable even in the dark
    const glow = (material?.emissiveIntensity ?? 0) * 1.2
    easing.damp(light.current, 'intensity', glow + (hovered ? 2.5 : 0), 0.15, delta)
    easing.damp3(group.current.scale, hovered ? 1.15 : 1, 0.1, delta)
  })

  return (
    <group ref={group} position={[-width / 2 + 1.3, height / 2 - 1.1, 0]}>
      <pointLight ref={light} position={[0.2, -0.1, 1.6]} distance={5} decay={0} intensity={0} />
      <mesh
        geometry={arrowGeometry}
        onClick={(e) => {
          e.stopPropagation()
          navigate('/')
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          hover(true)
        }}
        onPointerOut={() => hover(false)}
      >
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Generous invisible tap target */}
      <mesh
        visible={false}
        position={[0, 0, 0.1]}
        onClick={(e) => {
          e.stopPropagation()
          navigate('/')
        }}
        onPointerOver={() => hover(true)}
        onPointerOut={() => hover(false)}
      >
        <planeGeometry args={[1.8, 1.4]} />
      </mesh>
    </group>
  )
}
