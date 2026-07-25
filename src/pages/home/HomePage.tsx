import { SceneCanvasLayout } from '../../layout/SceneCanvasLayout'
import { HeroText } from '../../components/ui/HeroText'
import { CardScene } from './CardScene'
import { HandCarousel } from './HandCarousel'
import { HANDS_SUPPORTED } from '../../gestures/flag'

export function HomePage() {
  return (
    <>
      <SceneCanvasLayout camera={{ position: [0, 0, 100], fov: 15 }} backdrop="#eef0f2">
        <CardScene />
      </SceneCanvasLayout>
      <HeroText />
      {/* Renders nothing until hand tracking is actually running; the carousel's
          mouse and touch paths are untouched either way. */}
      {HANDS_SUPPORTED && <HandCarousel />}
    </>
  )
}
