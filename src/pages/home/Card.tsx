import { RoundedBox, Text } from '@react-three/drei'
import type { CardDatum } from './cardData'

interface CardProps {
  data: CardDatum
  position: [number, number, number]
  rotationY: number
}

export function Card({ data, position, rotationY }: CardProps) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[1.6, 2.2, 0.08]} radius={0.09} smoothness={4}>
        <meshStandardMaterial color="#e8e8ec" roughness={0.3} metalness={0.05} />
      </RoundedBox>
      <Text
        position={[0, 0, 0.05]}
        fontSize={0.16}
        maxWidth={1.3}
        textAlign="center"
        color="#111114"
        anchorX="center"
        anchorY="middle"
      >
        {data.label}
      </Text>
    </group>
  )
}
