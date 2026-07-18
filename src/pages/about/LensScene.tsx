import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { useFBO, useGLTF, useScroll, Text, Image, MeshTransmissionMaterial } from '@react-three/drei'
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

// Footer chrome auto-contrast (touch). mix-blend-mode can't blend over a WebGL
// canvas in Safari (it composites the canvas on its own layer), so instead we
// read the luminance of the scene buffer directly behind each chrome element
// and set its ink to black or white. Reused scratch buffer for the readback.
const _inkPx = new Uint8Array(8 * 8 * 4)
function bufferLuma(gl: THREE.WebGLRenderer, rt: THREE.WebGLRenderTarget, fx: number, fy: number) {
  // fx/fy are 0..1 across the buffer, origin bottom-left (WebGL convention).
  const S = 8
  const x = Math.max(0, Math.min(rt.width - S, Math.round(fx * rt.width - S / 2)))
  const y = Math.max(0, Math.min(rt.height - S, Math.round(fy * rt.height - S / 2)))
  gl.readRenderTargetPixels(rt, x, y, S, S, _inkPx)
  let sum = 0
  for (let i = 0; i < S * S; i++) sum += 0.299 * _inkPx[i * 4] + 0.587 * _inkPx[i * 4 + 1] + 0.114 * _inkPx[i * 4 + 2]
  return sum / (S * S)
}
const inkFor = (luma: number) => (luma < 140 ? '#fff' : '#000')

export function Lens({
  children,
  damping = 0.15,
}: {
  children: ReactNode
  damping?: number
}) {
  const ref = useRef<THREE.Mesh>(null!)
  // Decoder path is set globally to /draco/ (self-hosted) in src/lib/draco.ts.
  const { nodes } = useGLTF(LENS_MODEL)
  const buffer = useFBO()
  const viewport = useThree((state) => state.viewport)
  const scroll = useScroll()
  const [scene] = useState(() => new THREE.Scene())
  // Touch: the lens rests top-right; dragging it follows the finger, and on
  // release it eases back home (Preview-app magnifier behavior).
  const dragging = useRef(false)
  // Throttle accumulator for the back-link auto-contrast readback (touch only).
  const inkClock = useRef(0)
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

    if (IS_TOUCH) {
      // Reveal the footer only as the last page (the group photo) comes into
      // view, so it lands over that photo at the bottom instead of following
      // the whole scroll. Ramp 0→1 across the final stretch of the scroll.
      const shown = Math.max(0, Math.min(1, (scroll.offset - 0.85) / 0.1))
      document.documentElement.style.setProperty('--about-footer-shown', shown.toFixed(3))

      // Auto-contrast the back link against the scene buffer behind it (the
      // footer is white over the dark group photo, so it needs no readback).
      // One throttled GPU→CPU sample per tick keeps stalls rare.
      inkClock.current += delta
      if (inkClock.current > 0.12) {
        inkClock.current = 0
        document.documentElement.style.setProperty(
          '--about-back-ink',
          inkFor(bufferLuma(state.gl, buffer, 0.12, 0.93))
        )
      }
    }
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
    </>
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
