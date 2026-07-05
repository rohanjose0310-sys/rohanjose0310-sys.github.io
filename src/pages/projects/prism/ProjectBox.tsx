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
}

export function ProjectBox({ project, ...props }: ProjectBoxProps) {
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
        {...rayProps({ onRayOver: () => setRayHit(true), onRayOut: () => setRayHit(false) })}
      />
      <mesh ref={inner} geometry={roundedBoxGeometry}>
        <meshStandardMaterial color="#333" toneMapped={false} emissiveIntensity={2} />
      </mesh>
      {project && active && (
        <Html center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              // Anchored at the box center: lift the card its own half-height
              // plus a fixed gap so it floats just above the box.
              transform: 'translateY(calc(-50% - 48px))',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              width: '9.5rem',
              padding: '0.45rem',
              borderRadius: '0.6rem',
              background: 'rgba(11, 11, 15, 0.85)',
              border: '1px solid rgba(170, 255, 0, 0.4)',
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
