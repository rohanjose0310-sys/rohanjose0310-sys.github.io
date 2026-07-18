import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { useFBO, useGLTF, useScroll, Text, Image, MeshTransmissionMaterial, RoundedBox } from '@react-three/drei'
import { easing } from 'maath'
// Touch devices get different lens + type behavior (drag/spring-back lens,
// down-scaled typography). Desktop keeps the original pmndrs code paths.
import { IS_TOUCH } from '../../lib/touch'

// Faithful TS port of pmndrs/examples "scrollcontrols-and-lens-refraction".
// Assets live in public/about/ (swapped for real content later).
const LENS_MODEL = '/about/lens-transformed.glb'
const INTER_FONT = '/about/Inter-Regular.woff'

const IMG1 = '/about/img1.jpg'
const IMG3 = '/about/img3.jpg'
const IMG6 = '/about/img6.jpg'
const IMG7 = '/about/img7.jpg'
const IMG8 = '/about/img8.jpg'
const TRIP2 = '/about/trip2.jpg'
const TRIP4 = '/about/trip4.jpg'

// Desktop keeps the pmndrs scale; phones get a smaller lens so it can tuck
// into the top-right corner without covering half the screen.
const LENS_SCALE = IS_TOUCH ? 0.15 : 0.25

export function Lens({
  children,
  damping = 0.15,
  glassText,
}: {
  children: ReactNode
  damping?: number
  /** Touch only: intro copy shown on a fixed refractive glass card. */
  glassText?: string
}) {
  const ref = useRef<THREE.Mesh>(null!)
  const { nodes } = useGLTF(LENS_MODEL)
  const buffer = useFBO()
  const viewport = useThree((state) => state.viewport)
  const [scene] = useState(() => new THREE.Scene())
  // Touch: the lens rests top-right; dragging it follows the finger, and on
  // release it eases back home (Preview-app magnifier behavior).
  const dragging = useRef(false)
  const lensRadius = useMemo(() => {
    // Radius of the screen-facing circular face (bbox x-extent), not the
    // bounding sphere — that would also include the cylinder's height.
    const geometry = (nodes.Cylinder as THREE.Mesh).geometry
    if (!geometry.boundingBox) geometry.computeBoundingBox()
    const box = geometry.boundingBox ?? new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1))
    return ((box.max.x - box.min.x) / 2) * LENS_SCALE
  }, [nodes])
  useEffect(() => {
    if (!IS_TOUCH) return
    const release = () => (dragging.current = false)
    // While the lens is held, swallow touchmove so the page doesn't scroll.
    const blockScroll = (e: TouchEvent) => {
      if (dragging.current) e.preventDefault()
    }
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    window.addEventListener('touchmove', blockScroll, { passive: false })
    return () => {
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
      window.removeEventListener('touchmove', blockScroll)
    }
  }, [])
  useFrame((state, delta) => {
    // Tie lens to the pointer
    // getCurrentViewport gives us the width & height that would fill the screen in threejs units
    // By giving it a target coordinate we can offset these bounds, for instance width/height for a plane that
    // sits 15 units from 0/0/0 towards the camera (which is where the lens is)
    const viewport = state.viewport.getCurrentViewport(state.camera, [0, 0, 15])
    if (IS_TOUCH && !dragging.current) {
      const pad = viewport.height * 0.03
      easing.damp3(
        ref.current.position,
        [viewport.width / 2 - lensRadius - pad, viewport.height / 2 - lensRadius - pad, 15],
        0.4,
        delta
      )
    } else {
      easing.damp3(
        ref.current.position,
        [(state.pointer.x * viewport.width) / 2, (state.pointer.y * viewport.height) / 2, 15],
        damping,
        delta
      )
    }
    // This is entirely optional but spares us one extra render of the scene
    // The createPortal below will mount the children of <Lens> into the new THREE.Scene above
    // The following code will render that scene into a buffer, whose texture will then be fed into
    // a plane spanning the full screen and the lens transmission material
    state.gl.setRenderTarget(buffer)
    state.gl.setClearColor('#d8d7d7')
    state.gl.render(scene, state.camera)
    state.gl.setRenderTarget(null)
  })
  return (
    <>
      {createPortal(children, scene)}
      <mesh scale={[viewport.width, viewport.height, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={buffer.texture} />
      </mesh>
      <mesh
        scale={LENS_SCALE}
        ref={ref}
        rotation-x={Math.PI / 2}
        geometry={(nodes.Cylinder as THREE.Mesh).geometry}
        onPointerDown={IS_TOUCH ? () => (dragging.current = true) : undefined}>
        <MeshTransmissionMaterial buffer={buffer.texture} ior={1.2} thickness={1.5} anisotropy={0.1} chromaticAberration={0.04} />
      </mesh>
      {IS_TOUCH && glassText && <GlassCard buffer={buffer.texture} text={glassText} />}
    </>
  )
}

// Touch-only intro card: a slab of the same transmission glass as the lens,
// refracting whatever images sit behind it, with the bio copy on top. Lives
// in the main scene (not the scrolled portal, so its buffer sampling can't
// feed back into itself) but is hand-positioned to scroll in lockstep with
// the portal's Images/Typography, using the identical translateY formula
// drei's <Scroll> group uses internally — so it only appears at its own
// spot (around the "hand holding phone" photo) and scrolls away like any
// other page element, instead of floating fixed over the whole page.
function GlassCard({ buffer, text }: { buffer: THREE.Texture; text: string }) {
  const group = useRef<THREE.Group>(null!)
  const scroll = useScroll()
  // Default (z=0) viewport height — the same reference drei's <Scroll> group
  // uses to convert scroll offset into a world-space translateY, so this
  // card tracks Images/Typography exactly instead of drifting out of sync.
  const pageHeight = useThree((state) => state.viewport.height)
  const cardViewport = useThree((state) => state.viewport.getCurrentViewport(state.camera, [0, 0, 15]))
  // Authored (pre-scroll) position: sits just below the img8/trip4 photo
  // row (Images() places those at y = -pageHeight), matching where the old
  // desktop paragraph appeared alongside that photo.
  const localY = -pageHeight * 1.05
  // Only drift while a finger is down, then ease back to centre on release —
  // mirrors the reference profile photo, which returns home when the cursor
  // leaves. Without this the card would stick at the last touch point.
  const active = useRef(false)
  useEffect(() => {
    const down = () => (active.current = true)
    const up = () => (active.current = false)
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [])
  const vpW = cardViewport.width
  const vpH = cardViewport.height
  const w = vpW * 0.86
  const h = vpH * 0.34
  useFrame((state, delta) => {
    const scrollY = pageHeight * (scroll.pages - 1) * scroll.offset
    // Small pointer-driven parallax while touched, same feel as the resting
    // position logic above.
    const dx = active.current ? state.pointer.x * vpW * 0.05 : 0
    const dy = active.current ? state.pointer.y * vpH * 0.035 : 0
    easing.damp3(group.current.position, [dx, localY + scrollY + dy, 15], 0.35, delta)
  })
  return (
    <group ref={group}>
      <RoundedBox args={[w, h, 0.3]} radius={Math.min(w, h) * 0.14} smoothness={4}>
        <MeshTransmissionMaterial
          buffer={buffer}
          ior={1.15}
          thickness={0.6}
          anisotropy={0.1}
          chromaticAberration={0.03}
          roughness={0.35}
          samples={4}
          resolution={256}
        />
      </RoundedBox>
      <Text
        font={INTER_FONT}
        position={[0, 0, 0.2]}
        fontSize={vpW * 0.05}
        maxWidth={w * 0.86}
        lineHeight={1.35}
        letterSpacing={-0.02}
        color="black"
        anchorX="center"
        anchorY="middle">
        {text}
      </Text>
    </group>
  )
}

// drei <Image> meshes expose zoom/grayscale on their shader material.
type ImageMesh = THREE.Mesh & { material: { zoom: number; grayscale: number } }

export function Images() {
  const group = useRef<THREE.Group>(null!)
  const data = useScroll()
  const { width, height } = useThree((state) => state.viewport)
  useFrame(() => {
    const images = group.current.children as ImageMesh[]
    images[0].material.zoom = 1 + data.range(0, 1 / 3) / 3
    images[1].material.zoom = 1 + data.range(0, 1 / 3) / 3
    images[2].material.zoom = 1 + data.range(1.15 / 3, 1 / 3) / 2
    images[3].material.zoom = 1 + data.range(1.15 / 3, 1 / 3) / 2
    images[4].material.zoom = 1 + data.range(1.15 / 3, 1 / 3) / 2
    images[5].material.grayscale = 1 - data.range(1.6 / 3, 1 / 3)
    images[6].material.zoom = 1 + (1 - data.range(2 / 3, 1 / 3)) / 3
  })
  return (
    <group ref={group}>
      <Image position={[-2, 0, 0]} scale={[4, height]} url={IMG1} />
      <Image position={[2, 0, 3]} scale={3} url={IMG6} />
      <Image position={[-2.05, -height, 6]} scale={[1, 3]} url={TRIP2} />
      <Image position={[-0.6, -height, 9]} scale={[1, 2]} url={IMG8} />
      <Image position={[0.75, -height, 10.5]} scale={1.5} url={TRIP4} />
      <Image position={[0, -height * 1.5, 7.5]} scale={[1.5, 3]} url={IMG3} />
      <Image position={[0, -height * 2 - height / 4, 0]} scale={[width, height / 1.1]} url={IMG7} />
    </group>
  )
}

export function Typography() {
  const state = useThree()
  const { width, height } = state.viewport.getCurrentViewport(state.camera, [0, 0, 12])
  // Default fontSize is 1, tuned for desktop aspect ratios; on narrow touch
  // screens "home" would overflow the viewport, so scale type to fit.
  const fontSize = IS_TOUCH ? Math.min(1, width / 3) : 1
  const shared = { font: INTER_FONT, letterSpacing: -0.1, color: 'black', fontSize }
  return (
    <>
      <Text children="to" anchorX="left" position={[-width / 2.5, -height / 10, 12]} {...shared} />
      <Text children="be" anchorX="right" position={[width / 2.5, -height * 2, 12]} {...shared} />
      <Text children="home" position={[0, -height * 4.624, 12]} {...shared} />
    </>
  )
}
