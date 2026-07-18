import * as THREE from 'three'
import { useRef, useState, type ReactNode } from 'react'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { useFBO, useGLTF, useScroll, Text, Image, MeshTransmissionMaterial } from '@react-three/drei'
import { easing } from 'maath'

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

export function Lens({ children, damping = 0.15 }: { children: ReactNode; damping?: number }) {
  const ref = useRef<THREE.Mesh>(null!)
  const { nodes } = useGLTF(LENS_MODEL)
  const buffer = useFBO()
  const viewport = useThree((state) => state.viewport)
  const [scene] = useState(() => new THREE.Scene())
  useFrame((state, delta) => {
    // Tie lens to the pointer
    // getCurrentViewport gives us the width & height that would fill the screen in threejs units
    // By giving it a target coordinate we can offset these bounds, for instance width/height for a plane that
    // sits 15 units from 0/0/0 towards the camera (which is where the lens is)
    const viewport = state.viewport.getCurrentViewport(state.camera, [0, 0, 15])
    easing.damp3(
      ref.current.position,
      [(state.pointer.x * viewport.width) / 2, (state.pointer.y * viewport.height) / 2, 15],
      damping,
      delta
    )
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
      <mesh scale={0.25} ref={ref} rotation-x={Math.PI / 2} geometry={(nodes.Cylinder as THREE.Mesh).geometry}>
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
  const shared = { font: INTER_FONT, letterSpacing: -0.1, color: 'black' }
  return (
    <>
      <Text children="to" anchorX="left" position={[-width / 2.5, -height / 10, 12]} {...shared} />
      <Text children="be" anchorX="right" position={[width / 2.5, -height * 2, 12]} {...shared} />
      <Text children="home" position={[0, -height * 4.624, 12]} {...shared} />
    </>
  )
}
