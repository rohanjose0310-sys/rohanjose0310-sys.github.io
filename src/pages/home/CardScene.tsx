// Faithful port of the pmndrs cards-with-border-radius demo (src/App.jsx),
// with one addition: clicking a card navigates to its section route.
// https://github.com/pmndrs/examples/tree/main/demos/cards-with-border-radius
import * as THREE from 'three'
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { Image, Text, Environment, ScrollControls, useScroll, useTexture } from '@react-three/drei'
import { useNavigate } from 'react-router-dom'
import { easing } from 'maath'
import { CARDS } from './cardData'
import './util'

export function CardScene() {
  return (
    <>
      <fog attach="fog" args={['#a79', 8.5, 12]} />
      <ScrollControls pages={4} infinite>
        <Rig rotation={[0, 0, 0.15]}>
          <Carousel />
        </Rig>
        <Banner position={[0, -0.15, 0]} />
      </ScrollControls>
      <Environment preset="dawn" background blur={0.5} />
    </>
  )
}

function Rig(props: { rotation: [number, number, number]; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null!)
  const scroll = useScroll()
  useFrame((state, delta) => {
    ref.current.rotation.y = -scroll.offset * (Math.PI * 2) // Rotate contents
    state.events.update?.() // Raycasts every frame rather than on pointer-move
    easing.damp3(state.camera.position, [-state.pointer.x * 2, state.pointer.y + 1.5, 10], 0.3, delta)
    state.camera.lookAt(0, 0, 0)
  })
  return <group ref={ref} {...props} />
}

// One card per section, titled accordingly (see cardData.ts).
function Carousel({ radius = 1.1 }: { radius?: number }) {
  const count = CARDS.length
  return CARDS.map((card, i) => (
    <Card
      key={card.id}
      url={`/img${i + 1}_.jpg`}
      label={card.label}
      route={card.route}
      position={[
        Math.sin((i / count) * Math.PI * 2) * radius,
        0,
        Math.cos((i / count) * Math.PI * 2) * radius,
      ]}
      rotation={[0, Math.PI + (i / count) * Math.PI * 2, 0]}
    />
  ))
}

interface CardProps {
  url: string
  label: string
  route: string
  position: [number, number, number]
  rotation: [number, number, number]
}

function Card({ url, label, route, ...props }: CardProps) {
  const ref = useRef<THREE.Mesh>(null!)
  const [hovered, hover] = useState(false)
  const navigate = useNavigate()
  const pointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    hover(true)
  }
  const pointerOut = () => hover(false)
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    navigate(route)
  }
  useFrame((_state, delta) => {
    easing.damp3(ref.current.scale, hovered ? 1.15 : 1, 0.1, delta)
    const material = ref.current.material as THREE.Material & {
      radius: number
      zoom: number
    }
    easing.damp(material, 'radius', hovered ? 0.25 : 0.1, 0.2, delta)
    easing.damp(material, 'zoom', hovered ? 1 : 1.5, 0.2, delta)
  })
  return (
    <Image
      ref={ref}
      url={url}
      transparent
      side={THREE.DoubleSide}
      onPointerOver={pointerOver}
      onPointerOut={pointerOut}
      onClick={click}
      {...props}
    >
      <bentPlaneGeometry args={[0.1, 1, 1, 20, 20]} />
      {/* Cards face away (demo's PI flip) — mirror the label back toward the viewer. */}
      <Text
        position={[0, -0.64, -0.01]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.085}
        letterSpacing={0.02}
        color="#111"
        anchorX="center"
        anchorY="top"
      >
        {label}
      </Text>
    </Image>
  )
}

function Banner(props: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null!)
  const texture = useTexture('/work_.png')
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  const scroll = useScroll()
  useFrame((_state, delta) => {
    const material = ref.current.material as InstanceType<
      typeof import('./util').MeshSineMaterial
    > & { map: THREE.Texture }
    material.time.value += Math.abs(scroll.delta) * 4
    material.map.offset.x += delta / 2
  })
  return (
    <mesh ref={ref} {...props}>
      <cylinderGeometry args={[1.6, 1.6, 0.14, 128, 16, true]} />
      <meshSineMaterial
        map={texture}
        map-anisotropy={16}
        map-repeat={[30, 1]}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  )
}
