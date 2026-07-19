import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import {
  Box3,
  Vector3,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Group,
  type Material,
} from 'three'

// Generic viewer for converted CAD exports (.glb). Centers and normalizes the
// model to the same footprint as the demo shoe, applies the shoe's idle float,
// and upgrades Fusion's flat Kd-only materials to PBR by material name.
const TARGET_SIZE = 1.55

// useGLTF hands back one shared, cached scene. Track which scenes we've already
// upgraded so remounting (switching models and back) doesn't spawn duplicate
// materials every time.
const upgradedScenes = new WeakSet<object>()

function upgradeMaterial(material: Material, engineMetals = false): Material {
  const name = material.name
  // Engine-only re-skin: turn the CAD accent paints into machined engine
  // metals so the radial engine reads as one satin-metal object rather than
  // primary-coloured CAD. Scoped by the engineMetals flag so the helmet's
  // materials keep their exact original treatment below.
  if (engineMetals && /enamel|paint/i.test(name)) {
    const metal = (color: string, roughness: number) =>
      new MeshStandardMaterial({ name, color, metalness: 1, roughness })
    if (/green/i.test(name)) return metal('#565a5e', 0.42) // cylinder barrels — gunmetal
    if (/blue/i.test(name)) return metal('#3c4046', 0.42) // anthracite
    if (/red/i.test(name)) return metal('#c6c6ca', 0.16) // polished steel internals
    if (/yellow/i.test(name)) return metal('#b3894c', 0.3) // brass accent
    if (/grey|gray/i.test(name)) return metal('#2a2c2f', 0.38) // near-black satin
    return metal('#9a9ca0', 0.4)
  }
  if (/glass/i.test(name)) {
    const bronze = /bronze/i.test(name)
    return new MeshPhysicalMaterial({
      name,
      color: bronze ? '#8a6a48' : '#ffffff',
      transmission: 1,
      thickness: 0.15,
      roughness: 0.08,
      metalness: 0,
      transparent: true,
    })
  }
  if (/chrome/i.test(name)) {
    return new MeshStandardMaterial({ name, color: '#e8e8e8', metalness: 1, roughness: 0.08 })
  }
  if (/titanium|steel|alumin/i.test(name)) {
    // The satin-gray parts — deliberately not glossy. Reads as satin titanium
    // (the radial engine's crankcase + cylinders, the helmet's shell).
    return new MeshStandardMaterial({ name, color: '#d8d5cd', metalness: 1, roughness: 0.35 })
  }
  if (/red/i.test(name)) {
    // High-gloss orange shell parts (Fusion Kd #ff4000).
    return new MeshPhysicalMaterial({
      name,
      color: '#ff4000',
      roughness: 0.12,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    })
  }
  if (/matte.*gray|gray.*matte/i.test(name)) {
    // Fusion exported this Kd as pure black — render as glossy piano black.
    return new MeshPhysicalMaterial({
      name,
      color: '#0b0b0d',
      roughness: 0.15,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    })
  }
  if (material instanceof MeshStandardMaterial) {
    material.metalness = 0
    material.roughness = 0.75
  }
  return material
}

export function GlbModel({
  url,
  rotation = [0, 0, 0],
  engineMetals = false,
}: {
  url: string
  rotation?: [number, number, number]
  /** Re-skin CAD accent paints as engine metals (radial engine only). */
  engineMetals?: boolean
}) {
  const ref = useRef<Group>(null!)
  const { scene } = useGLTF(url)

  const { offset, scale } = useMemo(() => {
    if (!upgradedScenes.has(scene)) {
      scene.traverse((child) => {
        if (child instanceof Mesh) {
          child.castShadow = child.receiveShadow = true
          child.material = upgradeMaterial(child.material as Material, engineMetals)
        }
      })
      upgradedScenes.add(scene)
    }
    // Measure the scene's pristine bounds. The resulting transform is applied to
    // a wrapper <group> below, never to `scene` itself, so this measurement is
    // identical on every (re)mount instead of compounding the previous scale.
    const box = new Box3().setFromObject(scene)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    const s = TARGET_SIZE / Math.max(size.x, size.y, size.z)
    return { offset: center.multiplyScalar(-s).toArray(), scale: s }
  }, [scene, engineMetals])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    ref.current.rotation.set(Math.cos(t / 4) / 8, Math.sin(t / 3) / 4, 0.15 + Math.sin(t / 2) / 8)
    ref.current.position.y = (0.5 + Math.cos(t / 2)) / 7
  })

  return (
    <group ref={ref}>
      <group rotation={rotation}>
        <group position={offset} scale={scale}>
          <primitive object={scene} />
        </group>
      </group>
    </group>
  )
}
