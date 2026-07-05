// Faithful port of the pmndrs cards-with-border-radius demo (src/App.jsx),
// with one addition: clicking a card navigates to its section route.
// https://github.com/pmndrs/examples/tree/main/demos/cards-with-border-radius
import * as THREE from 'three'
import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { Image, Text, ScrollControls, useScroll, useTexture } from '@react-three/drei'
import { useNavigate } from 'react-router-dom'
import { easing } from 'maath'
import { CARDS } from './cardData'
import { swipe } from './swipe'
import './util'

export function CardScene() {
  return (
    <>
      {/* Sci-fi product-designer palette: white-grey studio backdrop. */}
      <color attach="background" args={['#eef0f2']} />
      <fog attach="fog" args={['#eef0f2', 8.5, 12]} />
      <ScrollControls pages={4} infinite>
        <Rig rotation={[0, 0, 0.15]}>
          <Carousel />
        </Rig>
        <Banner position={[0, -0.15, 0]} />
      </ScrollControls>
    </>
  )
}

function Rig(props: { rotation: [number, number, number]; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null!)
  const scroll = useScroll()

  // Drag/swipe to spin: horizontal pointer drags (finger or mouse) rotate the
  // carousel directly, with inertia after release. Desktop wheel scrolling
  // still spins it through ScrollControls.
  useEffect(() => {
    const el = scroll.el
    let lastX = 0
    let lastT = 0
    const down = (e: PointerEvent) => {
      if (!e.isPrimary) return
      swipe.dragging = true
      swipe.travel = 0
      swipe.velocity = 0
      lastX = e.clientX
      lastT = performance.now()
    }
    const move = (e: PointerEvent) => {
      if (!swipe.dragging || !e.isPrimary) return
      const dx = e.clientX - lastX
      lastX = e.clientX
      const now = performance.now()
      const dt = Math.max((now - lastT) / 1000, 1e-4)
      lastT = now
      swipe.travel += Math.abs(dx)
      // Full drag across the screen = 0.4 revolutions (~2 of the 5 cards)
      const turns = (dx / el.clientWidth) * 0.4
      swipe.offset += turns
      swipe.velocity = THREE.MathUtils.clamp(
        THREE.MathUtils.lerp(swipe.velocity, turns / dt, 0.35),
        -0.8,
        0.8,
      )
    }
    const up = () => (swipe.dragging = false)
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [scroll.el])

  useFrame((state, delta) => {
    if (!swipe.dragging) {
      swipe.offset += swipe.velocity * delta
      swipe.velocity *= Math.exp(-3 * delta) // inertia decay
    }
    // Rotate contents: wheel scroll and drag offsets combine
    ref.current.rotation.y = (swipe.offset - scroll.offset) * (Math.PI * 2)
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
    // A click also fires after a swipe ends on this card — ignore those
    if (swipe.travel > 12) return
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
        // Self-hosted: without a font prop, troika fetches one from a CDN at
        // runtime, and a failed fetch takes down the whole scene.
        font="/fonts/Inter-Regular.ttf"
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
    material.time.value += (Math.abs(scroll.delta) + Math.abs(swipe.velocity) * delta) * 4
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
