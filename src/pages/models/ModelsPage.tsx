import { FrostedScene } from './FrostedScene'
import { Overlay } from './Overlay'
import './models.css'

// Faithful recreation of pmndrs/examples demos/frosted-glass, plus a top-left
// model menu. The scene's stand-in shoe gets replaced per-model once real
// Fusion 360 / Rhino exports are converted to .glb.
export function ModelsPage() {
  return (
    <div className="frosted">
      <FrostedScene />
      <Overlay />
    </div>
  )
}
