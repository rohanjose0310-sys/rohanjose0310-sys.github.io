import * as THREE from 'three'
import { useRef, useState } from 'react'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { lerpC, rayProps } from './util'
import type { Project } from '../projectData'

// The demo's rounded Box, extended: it lights up when the beam reflects onto
// it OR the cursor hovers it, and (when a project is attached) shows a small
// card with the project's image and title.

const w = 1
const h = 1
const r = 0.1
const depth = 1
const s = new THREE.Shape()
s.moveTo(-w / 2, -h / 2 + r)
s.lineTo(-w / 2, h / 2 - r)
s.absarc(-w / 2 + r, h / 2 - r, r, 1 * Math.PI, 0.5 * Math.PI, true)
s.lineTo(w / 2 - r, h / 2)
s.absarc(w / 2 - r, h / 2 - r, r, 0.5 * Math.PI, 0 * Math.PI, true)
s.lineTo(w / 2, -h / 2 + r)
s.absarc(w / 2 - r, -h / 2 + r, r, 2 * Math.PI, 1.5 * Math.PI, true)
s.lineTo(-w / 2 + r, -h / 2)
s.absarc(-w / 2 + r, -h / 2 + r, r, 1.5 * Math.PI, 1 * Math.PI, true)

const boxGeometry = new THREE.BoxGeometry()
const roundedBoxGeometry = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false })
roundedBoxGeometry.translate(0, 0, -depth / 2)
roundedBoxGeometry.computeVertexNormals()

type ProjectBoxProps = Omit<ThreeElements['group'], 'ref'> & {
  project?: Project
  /** Hover-card offset in px: [horizontal, upward] from the box center. Push
   *  outward so the card doesn't overlap the central prism. */
  cardOffset?: [number, number]
}

export function ProjectBox({ project, cardOffset = [0, 48], ...props }: ProjectBoxProps) {
  const [rayHit, setRayHit] = useState(false)
  const [hovered, setHovered] = useState(false)
  const inner = useRef<THREE.Mesh>(null)
  const active = rayHit || hovered

  useFrame(() => {
    if (!inner.current) return
    const material = inner.current.material as THREE.MeshStandardMaterial
    lerpC(material.emissive, active ? 'white' : '#454545', 0.1)
  })

  return (
    <group scale={0.5} {...props}>
      <mesh
        visible={false}
        geometry={boxGeometry}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        // Touch has no hover: tapping the box shows the card, tapping
        // anywhere else hides it.
        onPointerDown={() => setHovered(true)}
        onPointerMissed={() => setHovered(false)}
        {...rayProps({ onRayOver: () => setRayHit(true), onRayOut: () => setRayHit(false) })}
      />
      <mesh ref={inner} geometry={roundedBoxGeometry}>
        <meshStandardMaterial color="#333" toneMapped={false} emissiveIntensity={2} />
      </mesh>
      {project && active && (
        <Html center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              // Anchored at the box center: lift by its own half-height, then
              // offset outward (away from the central prism) per cardOffset.
              transform: `translate(${cardOffset[0]}px, calc(-50% - ${cardOffset[1]}px))`,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              width: '9.5rem',
              padding: '0.45rem',
              borderRadius: '0.6rem',
              background: 'rgba(11, 11, 15, 0.85)',
              border: '1px solid rgba(255, 106, 0, 0.5)',
              boxShadow: '0 0.5rem 2rem rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(6px)',
              animation: 'fade-in 0.25s ease both',
            }}
          >
            <img
              src={project.image}
              alt={project.title}
              style={{
                display: 'block',
                width: '100%',
                height: '5rem',
                objectFit: 'cover',
                borderRadius: '0.35rem',
              }}
            />
            <span
              style={{
                fontSize: '0.8rem',
                letterSpacing: '0.04em',
                color: 'var(--text-h)',
                textAlign: 'center',
              }}
            >
              {project.title}
            </span>
          </div>
        </Html>
      )}
    </group>
  )
}
