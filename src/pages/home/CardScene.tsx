import { Card } from './Card'
import { CARDS } from './cardData'

const RADIUS = 4.2 // arc radius the cards sit on
const ARC_SPAN = Math.PI * 0.5 // total angular spread

export function CardScene() {
  return (
    <>
      <color attach="background" args={['#0b0b0f']} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 6, 5]} intensity={1.2} />
      <directionalLight position={[-5, -2, -4]} intensity={0.3} color="#7dd3fc" />

      {CARDS.map((card, i) => {
        const t = i / (CARDS.length - 1)
        const angle = -ARC_SPAN / 2 + t * ARC_SPAN
        const x = Math.sin(angle) * RADIUS
        const z = -Math.cos(angle) * RADIUS * 0.35 // gentle depth curve
        return (
          <Card key={card.id} data={card} position={[x, 0, z]} rotationY={-angle * 0.6} />
        )
      })}
    </>
  )
}
