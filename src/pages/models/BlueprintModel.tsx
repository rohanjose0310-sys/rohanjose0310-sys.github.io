import { useMemo } from 'react'
import * as THREE from 'three'

interface BlueprintModelProps {
  geometry: THREE.BufferGeometry
  /** Edge angle threshold in degrees — edges between faces flatter than this are dropped. */
  threshold?: number
  edgeColor?: string
  fillColor?: string
}

// The blueprint look: a near-background solid fill (with polygon offset so it
// sits behind the lines) occludes hidden edges, and an EdgesGeometry line
// overlay draws the visible ones. EdgesGeometry is computed once per
// geometry/threshold — it's the expensive part.
export function BlueprintModel({
  geometry,
  threshold = 15,
  edgeColor = '#9fd4ff',
  fillColor = '#0d1e33',
}: BlueprintModelProps) {
  const edges = useMemo(
    () => new THREE.EdgesGeometry(geometry, threshold),
    [geometry, threshold],
  )

  return (
    <group>
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color={fillColor}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={edgeColor} toneMapped={false} />
      </lineSegments>
    </group>
  )
}
