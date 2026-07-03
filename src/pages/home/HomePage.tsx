import { SceneCanvasLayout } from '../../layout/SceneCanvasLayout'
import { HeroText } from '../../components/ui/HeroText'
import { CardScene } from './CardScene'

export function HomePage() {
  return (
    <>
      <SceneCanvasLayout camera={{ position: [0, 0, 100], fov: 15 }}>
        <CardScene />
      </SceneCanvasLayout>
      <HeroText />
    </>
  )
}
