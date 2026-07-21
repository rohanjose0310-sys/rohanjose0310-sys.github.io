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
import { IS_TOUCH } from '../../lib/touch'
import './util'

// Touch tuning. A card occupies 1/5 of a revolution, so ~200px of finger
// travel advances exactly one card, and the release flick is capped so a
// hard swipe coasts at most ~0.6 of a card (coast = velocity / decay).
const TOUCH_TURNS_PER_PX = 0.2 / 200
const TOUCH_MAX_VELOCITY = 0.6 // revolutions/second
const TOUCH_DECAY = 5 // inertia falloff
// Narrow portrait aspect makes the horizontal frustum much tighter than the
// vertical one, so the ring of cards (which spreads out sideways) crops and
// overlaps the footer caption at the same camera distance that works on
// desktop. Pulling the touch camera back gives it room.
const TOUCH_CAMERA_Z = 20
/** Seconds of travel history the release flick is measured over. */
const FLICK_WINDOW = 0.08
// Fog near/far were tuned for the desktop camera, fixed at z=10. Card labels
// use drei's <Text>, which (unlike the cards' own custom shader material)
// respects scene fog — so pulling the touch camera back without also
// pushing fog back made labels fade past `far` and vanish into the
// background before the cards themselves showed any change at all.
const TOUCH_FOG_SHIFT = TOUCH_CAMERA_Z - 10

export function CardScene() {
  return (
    <>
      {/* Sci-fi product-designer palette: white-grey studio backdrop. */}
      <color attach="background" args={['#eef0f2']} />
      <fog
        attach="fog"
        args={
          IS_TOUCH
            ? ['#eef0f2', 8.5 + TOUCH_FOG_SHIFT, 12 + TOUCH_FOG_SHIFT]
            : ['#eef0f2', 8.5, 12]
        }
      />
      {/* On touch, take the overlay's native scrolling away so Safari never
          arbitrates the gesture (see swipe.ts). drei applies `style` after its
          own overflow rules, so this wins. ScrollControls then contributes a
          constant 0 offset and <Rig>'s handler is the only rotation source. */}
      <ScrollControls
        pages={4}
        infinite
        style={IS_TOUCH ? { overflow: 'hidden', touchAction: 'none' } : undefined}
      >
        <Rig rotation={[0, 0, 0.15]}>
          <Carousel />
        </Rig>
        <Banner position={[0, -0.15, 0]} />
      </ScrollControls>
    </>
  )
}

// Desktop: horizontal mouse drags add to the wheel-driven ScrollControls
// rotation, with inertia after release. Unchanged from the original port.
function attachMouseDrag(el: HTMLElement) {
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
}

// Touch: one gesture, both axes, no native scrolling underneath it.
function attachTouchDrag(el: HTMLElement) {
  let pointerId = -1
  let lastX = 0
  let lastY = 0
  /** Cumulative signed travel in px for the current drag. */
  let signed = 0
  // Rolling (time, travel) history. The flick is measured across a fixed
  // window rather than per-event: iOS delivers coalesced pointermoves with
  // near-identical timestamps, so a per-event travel/dt spikes to absurd
  // rates and saturates any clamp on even a gentle drag.
  let samples: { t: number; travel: number }[] = []

  const down = (e: PointerEvent) => {
    if (!e.isPrimary) return
    pointerId = e.pointerId
    // Capture so the moves keep arriving even if the finger leaves the div.
    // Throws if the pointer is already gone; the drag still works without it.
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      /* empty */
    }
    swipe.dragging = true
    swipe.travel = 0
    swipe.velocity = 0
    signed = 0
    lastX = e.clientX
    lastY = e.clientY
    samples = [{ t: performance.now(), travel: 0 }]
  }

  const move = (e: PointerEvent) => {
    if (!swipe.dragging || e.pointerId !== pointerId) return
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    lastX = e.clientX
    lastY = e.clientY
    // Both axes spin, keeping the signs the desktop inputs already use:
    // finger right (mouse drag) or finger down (wheel) turns it forward. A
    // diagonal simply contributes both, so no direction feels dead.
    const px = dx + dy
    signed += px
    swipe.travel += Math.hypot(dx, dy)
    swipe.offset += px * TOUCH_TURNS_PER_PX

    const now = performance.now()
    samples.push({ t: now, travel: signed })
    // Keep the oldest sample that is still at/just beyond the window edge.
    while (samples.length > 2 && now - samples[1].t > FLICK_WINDOW * 1000) samples.shift()
  }

  const end = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return
    pointerId = -1
    swipe.dragging = false
    // pointercancel means the gesture was taken away rather than released —
    // never coast off a drag the user didn't actually finish.
    if (e.type === 'pointercancel') {
      swipe.velocity = 0
      return
    }
    const oldest = samples[0]
    const dt = (performance.now() - oldest.t) / 1000
    // A finger that paused before lifting stretches dt without adding travel,
    // which correctly decays the flick to nothing.
    swipe.velocity =
      dt > 0.008
        ? THREE.MathUtils.clamp(
            ((signed - oldest.travel) / dt) * TOUCH_TURNS_PER_PX,
            -TOUCH_MAX_VELOCITY,
            TOUCH_MAX_VELOCITY,
          )
        : 0
  }

  el.addEventListener('pointerdown', down)
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerup', end)
  el.addEventListener('pointercancel', end)
  return () => {
    el.removeEventListener('pointerdown', down)
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerup', end)
    el.removeEventListener('pointercancel', end)
  }
}

function Rig(props: { rotation: [number, number, number]; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null!)
  const scroll = useScroll()

  // Drag/swipe to spin, with inertia after release. Desktop additionally
  // spins via wheel through ScrollControls; touch does not (see <CardScene>).
  useEffect(() => (IS_TOUCH ? attachTouchDrag(scroll.el) : attachMouseDrag(scroll.el)), [scroll.el])

  const prevTurns = useRef(0)
  useFrame((state, delta) => {
    if (!swipe.dragging) {
      swipe.offset += swipe.velocity * delta
      swipe.velocity *= Math.exp(-(IS_TOUCH ? TOUCH_DECAY : 3) * delta) // inertia decay
    }
    // Rotate contents: wheel scroll and drag offsets combine
    const turns = swipe.offset - scroll.offset
    swipe.delta = Math.abs(turns - prevTurns.current)
    prevTurns.current = turns
    ref.current.rotation.y = turns * (Math.PI * 2)
    // Raycasts every frame rather than on pointer-move. Skipped on touch,
    // where there is no hover to track and replaying the last pointer event
    // would leave a tapped card stuck in its hovered scale.
    if (!IS_TOUCH) state.events.update?.()
    // Mouse parallax. state.pointer never recenters on touch — it freezes
    // wherever the last tap landed — so the camera stays put there instead.
    const target: [number, number, number] = IS_TOUCH
      ? [0, 1.5, TOUCH_CAMERA_Z]
      : [-state.pointer.x * 2, state.pointer.y + 1.5, 10]
    easing.damp3(state.camera.position, target, 0.3, delta)
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
    // A click also fires after a swipe ends on this card — ignore those. The
    // touch threshold is looser to absorb the drift in an ordinary tap.
    if (swipe.travel > (IS_TOUCH ? 16 : 12)) return
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
      // No hover on touch — a tap would latch it on with nothing to clear it.
      onPointerOver={IS_TOUCH ? undefined : pointerOver}
      onPointerOut={IS_TOUCH ? undefined : pointerOut}
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
  const texture = useTexture('/work_.png', (t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
  })
  const scroll = useScroll()
  useFrame((_state, delta) => {
    const material = ref.current.material as InstanceType<
      typeof import('./util').MeshSineMaterial
    > & { map: THREE.Texture }
    // On touch ScrollControls contributes nothing, so drive the wave off the
    // rotation the carousel actually made this frame — both are revolutions
    // per frame, so the wave keeps the same feel it has on desktop.
    material.time.value +=
      (IS_TOUCH ? swipe.delta : Math.abs(scroll.delta) + Math.abs(swipe.velocity) * delta) * 4
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
