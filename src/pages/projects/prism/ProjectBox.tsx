import * as THREE from 'three'
import { useEffect, useRef, useState } from 'react'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useNavigate } from 'react-router-dom'
import { lerpC, rayProps } from './util'
import { registerHitbox } from './hitboxes'
import { claimBeam, claimHover, releaseBeam, useFocus } from '../focus'
import { aim } from '../aim'
import { IS_TOUCH } from '../../../lib/touch'
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
  const hitbox = useRef<THREE.Mesh>(null)
  const navigate = useNavigate()
  const focusSnap = useFocus()
  // Per-diamond glow stays local and unarbitrated — every beam-lit diamond
  // still lights up even when another one wins the card (see focus.ts).
  const active = rayHit || hovered
  const showCard = Boolean(project) && focusSnap.id === project?.id

  // The hand cursor raycasts this same hitbox to answer "is the cursor on this
  // diamond", which the beam can't do — see hitboxes.ts.
  useEffect(() => {
    if (!project || !hitbox.current) return
    return registerHitbox(project.id, hitbox.current)
  }, [project])

  useFrame(() => {
    if (!inner.current) return
    const material = inner.current.material as THREE.MeshStandardMaterial
    lerpC(material.emissive, active ? 'white' : '#454545', 0.1)
  })

  const goToProject = (e: { stopPropagation: () => void }) => {
    if (!project) return
    e.stopPropagation()
    navigate(`/projects/${project.id}`)
  }

  return (
    <group scale={0.5} {...props}>
      <mesh
        ref={hitbox}
        visible={false}
        geometry={boxGeometry}
        onPointerOver={() => {
          setHovered(true)
          if (project) claimHover(project.id)
        }}
        onPointerOut={() => {
          setHovered(false)
          if (project) claimHover(null)
        }}
        // Touch has no hover: tapping the box shows the card, tapping
        // anywhere else hides it.
        onPointerDown={() => {
          setHovered(true)
          if (project) claimHover(project.id)
        }}
        onPointerMissed={() => {
          setHovered(false)
          if (project) claimHover(null)
        }}
        // The diamond itself is a large secondary target, mirroring the
        // in-scene navigation precedent in BackArrow.tsx. Desktop only: a tap
        // fires pointerdown *and* click, so on touch this would navigate on the
        // very tap meant to open the card — the visitor would never see the
        // preview, which is the only thing standing in for the hover they don't
        // have. There, the card's own button is the way in.
        onClick={IS_TOUCH ? undefined : goToProject}
        {...rayProps({
          onRayOver: () => setRayHit(true),
          onRayOut: () => {
            setRayHit(false)
            if (project) releaseBeam(project.id)
          },
          // `e.intersects` is the whole bounce chain in order (see Reflect.tsx
          // and focus.ts) — this diamond's index in it is exactly how many
          // bounces the beam took to reach it, i.e. how directly the cursor
          // is aiming here. The arbiter picks the lowest one.
          onRayMove: (e) => project && claimBeam(project.id, e.intersects.indexOf(e.intersect)),
        })}
      />
      <mesh ref={inner} geometry={roundedBoxGeometry}>
        <meshStandardMaterial color="#333" toneMapped={false} emissiveIntensity={2} />
      </mesh>
      {project && showCard && (
        // Desktop: the card is a readout only and must never take a pointer —
        // it sits where the beam is pointing, and swallowing a click there
        // would stop the click that opens the project. Touch has no beam, so
        // there the card is the tap target.
        <Html center zIndexRange={[100, 0]} style={{ pointerEvents: IS_TOUCH ? 'auto' : 'none' }}>
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
            <span
              style={{
                fontSize: '0.65rem',
                lineHeight: 1.4,
                color: 'var(--text)',
                textAlign: 'center',
              }}
            >
              {project.tagline}
            </span>
            {IS_TOUCH ? (
              <button
                type="button"
                // The card is a drei <Html> portal, mounted onto the DOM tree
                // outside the R3F canvas — a plain onClick risks firing after
                // (or racing) R3F's onPointerMissed on the invisible hitbox
                // below, which would clear the card before navigation runs.
                // onPointerDown + stopPropagation fires first and settles it.
                onPointerDown={goToProject}
                style={{
                  appearance: 'none',
                  border: 'none',
                  borderRadius: '0.35rem',
                  padding: '0.35rem 0.5rem',
                  fontSize: '0.68rem',
                  letterSpacing: '0.03em',
                  color: '#0b0b0f',
                  background: 'var(--accent)',
                  cursor: 'pointer',
                }}
              >
                View project →
              </button>
            ) : (
              // Not a button — nothing here is clickable. The beam is already
              // on this diamond, so the click can land anywhere. In hand mode
              // there is no click at all, so it names the gesture instead:
              // this line is the card's only call to action, and telling a
              // visitor with no cursor to click is worse than saying nothing.
              <span
                style={{
                  fontSize: '0.6rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--accent)',
                  textAlign: 'center',
                }}
              >
                {aim.source === 'hand' ? 'Pinch to open' : 'Click to open'}
              </span>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}
