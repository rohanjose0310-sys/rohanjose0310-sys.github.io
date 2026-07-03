import { Suspense } from 'react'
import { ContactShadows, Environment } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useControls } from 'leva'
import { CameraRig } from '../../three/CameraRig'
import { Card } from './Card'
import { CARDS } from './cardData'

export function CardScene() {
  // Dev-only tuning — the Leva panel is mounted (hidden in prod) in RootLayout.
  const { radius, arcSpan, hoverLift, bloomIntensity } = useControls('Cards', {
    radius: { value: 4.2, min: 2, max: 8, step: 0.1 },
    arcSpan: { value: Math.PI * 0.5, min: 0, max: Math.PI, step: 0.05 },
    hoverLift: { value: 0.6, min: 0, max: 2, step: 0.05 },
    bloomIntensity: { value: 0.35, min: 0, max: 2, step: 0.05 },
  })

  return (
    <>
      <color attach="background" args={['#0b0b0f']} />
      <CameraRig />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 6, 5]} intensity={1.2} />
      <directionalLight position={[-5, -2, -4]} intensity={0.3} color="#7dd3fc" />

      <Suspense fallback={null}>
        <Environment preset="city" environmentIntensity={0.35} />
        {CARDS.map((card, i) => {
          const t = i / (CARDS.length - 1)
          const angle = -arcSpan / 2 + t * arcSpan
          const x = Math.sin(angle) * radius
          const z = -Math.cos(angle) * radius * 0.35 // gentle depth curve
          return (
            <Card
              key={card.id}
              data={card}
              position={[x, 0, z]}
              rotationY={-angle * 0.6}
              hoverLift={hoverLift}
              floatOffset={i}
            />
          )
        })}
        <ContactShadows position={[0, -1.4, 0]} opacity={0.5} blur={2.4} far={4} />
      </Suspense>

      <EffectComposer multisampling={0}>
        <Bloom intensity={bloomIntensity} luminanceThreshold={0.7} mipmapBlur radius={0.5} />
      </EffectComposer>
    </>
  )
}
