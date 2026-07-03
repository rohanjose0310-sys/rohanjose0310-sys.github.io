import { SceneCanvasLayout } from '../../layout/SceneCanvasLayout'
import { HeroText } from '../../components/ui/HeroText'
import { CardScene } from './CardScene'

export function HomePage() {
  return (
    <>
      <SceneCanvasLayout>
        <CardScene />
      </SceneCanvasLayout>
      <HeroText />
    </>
  )
}
