import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { BlueprintModel } from './BlueprintModel'

interface GlbBlueprintModelProps {
  id: string
  threshold?: number
  edgeColor?: string
}

// Loads a gltfjsx-compressed .glb from public/models/<id>.glb and renders
// every mesh in it with the blueprint edge treatment. Suspends while loading —
// wrap in <Suspense>. No entries use this yet; it's the drop-in path for real
// CAD exports.
export function GlbBlueprintModel({ id, threshold, edgeColor }: GlbBlueprintModelProps) {
  const { scene } = useGLTF(`/models/${id}.glb`)

  const meshes: THREE.Mesh[] = []
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) meshes.push(child)
  })

  return (
    <group>
      {meshes.map((mesh) => (
        <group
          key={mesh.uuid}
          position={mesh.getWorldPosition(new THREE.Vector3())}
          quaternion={mesh.getWorldQuaternion(new THREE.Quaternion())}
          scale={mesh.getWorldScale(new THREE.Vector3())}
        >
          <BlueprintModel geometry={mesh.geometry} threshold={threshold} edgeColor={edgeColor} />
        </group>
      ))}
    </group>
  )
}
