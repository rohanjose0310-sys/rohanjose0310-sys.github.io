import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { RoundedBox, Text } from '@react-three/drei'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import * as THREE from 'three'
import type { CardDatum } from './cardData'

interface CardProps {
  data: CardDatum
  position: [number, number, number]
  rotationY: number
  hoverLift?: number
  floatOffset?: number
}

export function Card({ data, position, rotationY, hoverLift = 0.6, floatOffset = 0 }: CardProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const innerRef = useRef<THREE.Group>(null!)
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()

  // Idle float: sinusoidal bob + tiny roll, phase-offset per card.
  // Runs on the outer group so it never fights the hover tween (inner group).
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + floatOffset * 1.3
    groupRef.current.position.y = position[1] + Math.sin(t * 0.6) * 0.08
    groupRef.current.rotation.z = Math.sin(t * 0.4) * 0.015
  })

  // Hover: lift toward camera + slight scale-up. useGSAP scopes and cleans up
  // the tweens automatically on unmount (route transitions).
  useGSAP(() => {
    gsap.to(innerRef.current.position, {
      z: hovered ? hoverLift : 0,
      duration: 0.5,
      ease: 'power3.out',
    })
    gsap.to(innerRef.current.scale, {
      x: hovered ? 1.08 : 1,
      y: hovered ? 1.08 : 1,
      z: hovered ? 1.08 : 1,
      duration: 0.5,
      ease: 'power3.out',
    })
  }, [hovered, hoverLift])

  const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }

  const onPointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(false)
    document.body.style.cursor = 'auto'
  }

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    document.body.style.cursor = 'auto'
    navigate(data.route)
  }

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
      <group ref={innerRef}>
        <RoundedBox
          args={[1.6, 2.2, 0.08]}
          radius={0.09}
          smoothness={4}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
          onClick={onClick}
        >
          <meshStandardMaterial
            color={hovered ? '#ffffff' : '#e8e8ec'}
            roughness={0.3}
            metalness={0.05}
          />
        </RoundedBox>
        <Text
          position={[0, 0, 0.05]}
          fontSize={0.16}
          maxWidth={1.3}
          textAlign="center"
          color="#111114"
          anchorX="center"
          anchorY="middle"
        >
          {data.label}
        </Text>
      </group>
    </group>
  )
}
