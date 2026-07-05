import * as THREE from 'three'
import { useCallback, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Center, Text3D } from '@react-three/drei'
import { Beam } from './prism/Beam'
import { Rainbow, type RainbowMaterialImpl } from './prism/Rainbow'
import { Prism } from './prism/Prism'
import { Flare } from './prism/Flare'
import { ProjectBox } from './prism/ProjectBox'
import type { RayEvent, ReflectApi } from './prism/Reflect'
import { calculateRefractionAngle, lerp, lerpV3 } from './prism/util'
import { BackArrow } from './BackArrow'
import { PROJECTS } from './projectData'

import interFont from './assets/Inter_Bold.json?url'

// Port of the pmndrs nextjs-prism scene: a light beam follows the pointer,
// refracts through the prism into a rainbow that lights up the caption.

export function PrismScene() {
  const [isPrismHit, hitPrism] = useState(false)
  const flare = useRef<THREE.Group>(null)
  const ambient = useRef<THREE.AmbientLight>(null)
  const spot = useRef<THREE.SpotLight>(null)
  const boxreflect = useRef<ReflectApi>(null)
  const rainbow = useRef<THREE.Mesh>(null)
  const [vec] = useState(() => new THREE.Vector3())
  // Last stable beam direction; starts from the upper left so the scene
  // greets visitors lit instead of dark (matters on touch, where nothing
  // moves the pointer until the first tap).
  const [beamDir] = useState(() => new THREE.Vector2(-0.55, 0.75).normalize())

  const rayOut = useCallback(() => hitPrism(false), [])
  const rayOver = useCallback((e: RayEvent) => {
    // Break raycast so the ray stops when it touches the prism
    e.stopPropagation()
    hitPrism(true)
    const material = rainbow.current!.material as RainbowMaterialImpl
    material.speed = 1
    // The demo spiked intensity to 20 on every contact — one dramatic flash
    // with a mouse, but a strobing grey-out on touch, where dragging across
    // the prism re-enters constantly. Pop gently, and only from dark.
    if (material.emissiveIntensity < 1) material.emissiveIntensity = 6
  }, [])

  const rayMove = useCallback(
    ({ api, position, direction, normal }: RayEvent) => {
      if (!normal || !direction) return
      // Extend the line to the prism's center
      vec.toArray(api.positions, api.number++ * 3)
      // Set flare
      flare.current!.position.set(position.x, position.y, -0.5)
      flare.current!.rotation.set(0, 0, -Math.atan2(direction.x, direction.y))
      // Calculate refraction angles
      let angleScreenCenter = Math.atan2(-position.y, -position.x)
      const normalAngle = Math.atan2(normal.y, normal.x)
      // The angle between the ray and the normal
      const incidentAngle = angleScreenCenter - normalAngle
      // Calculate the refraction for the incident angle
      const refractionAngle = calculateRefractionAngle(incidentAngle) * 6
      // Apply the refraction
      angleScreenCenter += refractionAngle
      rainbow.current!.rotation.z = angleScreenCenter
      // Set spot light
      lerpV3(spot.current!.target.position, [Math.cos(angleScreenCenter), Math.sin(angleScreenCenter), 0], 0.05)
      spot.current!.target.updateMatrixWorld()
    },
    [vec],
  )

  useFrame((state) => {
    if (!boxreflect.current || !rainbow.current || !spot.current || !ambient.current) return
    // The pointer steers the beam's direction; the beam itself always enters
    // from beyond the screen edge. An origin tied to the pointer position
    // (as in the demo) can sit inside the prism or a box, which makes the
    // raycast flicker every frame — from outside the viewport it always
    // sweeps cleanly across the scene and deflects off boxes in its path.
    const px = (state.pointer.x * state.viewport.width) / 2
    const py = (state.pointer.y * state.viewport.height) / 2
    const dist = Math.hypot(px, py)
    if (dist > 0.5) beamDir.set(px / dist, py / dist)
    const reach = Math.hypot(state.viewport.width, state.viewport.height) / 2 + 2
    boxreflect.current.setRay([beamDir.x * reach, beamDir.y * reach, 0], [0, 0, 0])
    // Animate rainbow intensity
    const material = rainbow.current.material as RainbowMaterialImpl
    lerp(material, 'emissiveIntensity', isPrismHit ? 2.5 : 0, 0.1)
    spot.current.intensity = material.emissiveIntensity
    // Animate ambience
    lerp(ambient.current, 'intensity', 0, 0.025)
  })

  return (
    <>
      {/* Lights */}
      <ambientLight ref={ambient} intensity={0} />
      <pointLight position={[10, -10, 0]} intensity={0.05 * Math.PI} decay={0} />
      <pointLight position={[0, 10, 0]} intensity={0.05 * Math.PI} decay={0} />
      <pointLight position={[-10, 0, 0]} intensity={0.05 * Math.PI} decay={0} />
      <spotLight
        ref={spot}
        intensity={Math.PI}
        decay={0}
        distance={7}
        angle={1}
        penumbra={1}
        position={[0, 0, 1]}
      />
      {/* Caption — revealed by the spotlight when the rainbow is active */}
      <Center top bottom position={[0, 2, 0]}>
        <Text3D size={0.7} letterSpacing={-0.05} height={0.05} font={interFont}>
          My Projects
          <meshStandardMaterial color="white" />
        </Text3D>
      </Center>
      {/* Prism + project boxes + reflect beam */}
      <Beam ref={boxreflect} bounce={10} far={20}>
        <Prism position={[0, -0.5, 0]} onRayOver={rayOver} onRayOut={rayOut} onRayMove={rayMove} />
        <ProjectBox project={PROJECTS[0]} position={[-2.5, -2.5, 0]} rotation={[0, 0, Math.PI / 4]} />
        <ProjectBox project={PROJECTS[1]} position={[2.25, -3.5, 0]} rotation={[0, 0, Math.PI / 3.5]} />
        <ProjectBox position={[-3, 1, 0]} rotation={[0, 0, Math.PI / 4]} />
      </Beam>
      {/* Rainbow and flares */}
      <Rainbow ref={rainbow} startRadius={0} endRadius={0.5} fade={0} />
      <Flare ref={flare} visible={isPrismHit} renderOrder={10} scale={1.25} streak={[12.5, 20, 1]} />
      {/* Back-home arrow, revealed by light just like the caption */}
      <BackArrow rainbow={rainbow} />
    </>
  )
}
