import { Suspense } from 'react'
import { Grid, OrbitControls } from '@react-three/drei'
import { useControls } from 'leva'
import { BlueprintModel } from './BlueprintModel'
import { GlbBlueprintModel } from './GlbBlueprintModel'
import { PLACEHOLDER_GEOMETRIES } from './placeholderGeometries'
import type { ModelDatum } from './modelData'

export function ModelsScene({ model }: { model: ModelDatum }) {
  const { edgeColor, threshold } = useControls('Blueprint', {
    edgeColor: '#9fd4ff',
    threshold: { value: 15, min: 1, max: 60, step: 1 },
  })

  return (
    <>
      <color attach="background" args={['#0a1420']} />

      <Suspense fallback={null}>
        {model.kind === 'placeholder' ? (
          <BlueprintModel
            geometry={PLACEHOLDER_GEOMETRIES[model.id]}
            threshold={threshold}
            edgeColor={edgeColor}
          />
        ) : (
          <GlbBlueprintModel id={model.id} threshold={threshold} edgeColor={edgeColor} />
        )}
      </Suspense>

      <Grid
        position={[0, -1.6, 0]}
        infiniteGrid
        cellSize={0.5}
        sectionSize={2.5}
        cellColor="#1b3a57"
        sectionColor="#2d5a85"
        fadeDistance={22}
        fadeStrength={1.5}
      />

      <OrbitControls
        enablePan={false}
        enableDamping
        autoRotate
        autoRotateSpeed={0.8}
        minDistance={3}
        maxDistance={12}
        maxPolarAngle={Math.PI * 0.55}
      />
    </>
  )
}
