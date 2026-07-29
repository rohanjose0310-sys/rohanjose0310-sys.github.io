import * as THREE from 'three'
import { useEffect, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useCursor, MeshReflectorMaterial, Image, Text, Environment } from '@react-three/drei'
import { easing } from 'maath'
import { IS_TOUCH } from '../../../lib/touch'
import type { GalleryImage } from '../projectData'

// Line-for-line port of the pmndrs image-gallery demo (MIT):
// https://github.com/pmndrs/examples/blob/main/demos/image-gallery/src/index.jsx
//
// Three forced deviations from the original, each noted where it happens:
//  1. No `wouter` — this repo is react-router-dom v7, and the demo's route
//     (`/item/:id`) has no equivalent here since `:id` in this app already
//     names the *project*. Frame selection is local `useState` instead.
//  2. No `uuid-by-string` — the image's url, slugified, is already a stable
//     per-frame mesh `name` without adding a dependency. (The demo rendered
//     that uuid as the frame's label; here the label is the real caption.)
//  3. `<Text>` gets an explicit `font`, or troika fetches Roboto from a CDN.
//  4. The demo's hover-frame tint is CSS 'orange' (#ffa500) — swapped for this
//     site's actual accent color (index.css's --accent, #ff6a00) so the
//     gallery's hover state reads as the same orange used everywhere else.
//
// The demo's text column beside each frame carries the actual writing — see
// GalleryImage.caption. A DOM panel was tried instead and removed: at a size
// worth reading it covered the frames behind it, so they could not be clicked.

const GOLDENRATIO = 1.61803398875

// "/img1_.jpg" -> "img1jpg". Stands in for the demo's getUuid(url): all it
// needs to be is stable and unique per frame within one project.
const slug = (url: string) =>
  url
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

export function GalleryScene({ images }: { images: GalleryImage[] }) {
  return (
    <group position={[0, -0.5, 0]}>
      <Frames images={images} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        {/* This is the heaviest material on the page. Full demo settings
            (2048 / [300,100]) stay on desktop; touch backs off to 1024 /
            [200,60], matching this repo's AdaptiveSceneDpr posture elsewhere. */}
        <MeshReflectorMaterial
          blur={IS_TOUCH ? [200, 60] : [300, 100]}
          resolution={IS_TOUCH ? 1024 : 2048}
          mixBlur={1}
          mixStrength={80}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050505"
          metalness={0.5}
        />
      </mesh>
      <Environment preset="city" />
    </group>
  )
}

function Frames({
  images,
  q = new THREE.Quaternion(),
  p = new THREE.Vector3(),
}: {
  images: GalleryImage[]
  q?: THREE.Quaternion
  p?: THREE.Vector3
}) {
  const ref = useRef<THREE.Group>(null!)
  const clicked = useRef<THREE.Object3D | undefined>(undefined)
  const [selected, setSelected] = useState<string | null>(null)
  useEffect(() => {
    clicked.current = selected ? (ref.current.getObjectByName(selected) ?? undefined) : undefined
    if (clicked.current) {
      clicked.current.parent!.updateWorldMatrix(true, true)
      clicked.current.parent!.localToWorld(p.set(0, GOLDENRATIO / 2, 1.25))
      clicked.current.parent!.getWorldQuaternion(q)
    } else {
      p.set(0, 0, 5.5)
      q.identity()
    }
  })
  useFrame((state, dt) => {
    easing.damp3(state.camera.position, p, 0.4, dt)
    easing.dampQ(state.camera.quaternion, q, 0.4, dt)
  })
  return (
    <group
      ref={ref}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        setSelected(clicked.current === e.object ? null : e.object.name)
      }}
      onPointerMissed={() => setSelected(null)}
    >
      {images.map((img, i) => {
        // Solasphere reuses its 6 real photos across 9 frame slots (see
        // projectData.ts), so the url alone is no longer a unique per-frame
        // id — two frames sharing a name would make getObjectByName above
        // always resolve to the first one and both frames highlight together.
        // The slot index makes every frame distinct regardless of image reuse.
        const name = `${slug(img.url)}-${i}`
        return <Frame key={name} {...img} name={name} active={selected === name} />
      })}
    </group>
  )
}

// drei <Image> meshes expose zoom/grayscale on their shader material — same
// cast used for the same reason in about/LensScene.tsx.
type ImageMesh = THREE.Mesh & { material: { zoom: number } }

function Frame({
  url,
  caption,
  name,
  active,
  position,
  rotation,
}: GalleryImage & { name: string; active: boolean }) {
  const image = useRef<ImageMesh>(null!)
  const frame = useRef<THREE.Mesh>(null!)
  const [hovered, hover] = useState(false)
  const [rnd] = useState(() => Math.random())
  useCursor(hovered)
  useFrame((state, dt) => {
    image.current.material.zoom = 2 + Math.sin(rnd * 10000 + state.clock.elapsedTime / 3) / 2
    // Same relative inset/hover-shrink the demo used (0.85 width, 0.9 height,
    // shrinking further on hover) — just baselined against Image's own
    // [1, GOLDENRATIO] scale below instead of an implicit [1, 1], since that
    // scale moved from the parent mesh onto Image itself. See the comment by
    // the <Image> tag for why.
    easing.damp3(
      image.current.scale,
      [0.85 * (!active && hovered ? 0.85 : 1), GOLDENRATIO * 0.9 * (!active && hovered ? 0.905 : 1), 1],
      0.1,
      dt,
    )
    easing.dampC((frame.current.material as THREE.MeshBasicMaterial).color, hovered ? '#ff6a00' : 'white', 0.1, dt)
  })
  return (
    <group position={position} rotation={rotation}>
      <mesh
        name={name}
        onPointerOver={(e) => {
          e.stopPropagation()
          hover(true)
        }}
        onPointerOut={() => hover(false)}
        scale={[1, GOLDENRATIO, 0.05]}
        position={[0, GOLDENRATIO / 2, 0]}
      >
        <boxGeometry />
        <meshStandardMaterial color="#151515" metalness={0.5} roughness={0.5} envMapIntensity={2} />
        <mesh ref={frame} raycast={() => null} scale={[0.9, 0.93, 0.9]} position={[0, 0, 0.2]}>
          <boxGeometry />
          <meshBasicMaterial toneMapped={false} fog={false} />
        </mesh>
      </mesh>
      {/* Deliberately NOT nested inside the box above (unlike the demo).
          drei's <Image> cover-crops assuming ITS OWN `scale` prop is the
          on-screen aspect it fills; left at the default (square) while
          nested inside the box's non-uniform [1, GOLDENRATIO, 0.05] scale,
          the shader crops to a square and the parent transform then
          stretches that square 1.618x taller — invisible on the demo's
          landscape stock photos, glaring on our portrait installation shots.
          scale={[1, GOLDENRATIO]} here tells the shader the real target
          aspect, and this position replicates exactly where nesting used to
          place it (the box's own position, offset 0.035 forward — 0.7 in the
          box's old local z, scaled by the box's 0.05 z-scale). */}
      <Image
        raycast={() => null}
        ref={image}
        position={[0, GOLDENRATIO / 2, 0.035]}
        url={url}
        scale={[1, GOLDENRATIO]}
      />
      {/* The demo's label slot, same anchor, position and fontSize — only
          `maxWidth` is opened up from 0.1, which at this size wraps a sentence
          to roughly four characters a line. */}
      <Text
        font="/fonts/Inter-Regular.ttf"
        maxWidth={0.45}
        anchorX="left"
        anchorY="top"
        position={[0.55, GOLDENRATIO, 0]}
        fontSize={0.025}
        lineHeight={1.4}
      >
        {caption}
      </Text>
    </group>
  )
}
