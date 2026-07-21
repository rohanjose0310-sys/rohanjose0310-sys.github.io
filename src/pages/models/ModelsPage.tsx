import { useEffect } from 'react'
import { FrostedScene } from './FrostedScene'
import { Overlay } from './Overlay'
import { IS_TOUCH } from '../../lib/touch'
import './models.css'

// Faithful recreation of pmndrs/examples demos/frosted-glass, plus a top-left
// model menu. The scene's stand-in shoe gets replaced per-model once real
// Fusion 360 / Rhino exports are converted to .glb.
export function ModelsPage() {
  // Park the document one runway-length in so Safari has a non-zero scroll
  // offset to composite against (see .scroll-runway in models.css). Nothing
  // moves: .frosted is fixed, and touch-action pins the offset where we put it.
  useEffect(() => {
    if (IS_TOUCH) window.scrollTo(0, 120)
  }, [])
  return (
    <>
      <div className="frosted">
        <FrostedScene />
        <Overlay />
      </div>
      {IS_TOUCH && <div className="scroll-runway" aria-hidden="true" />}
    </>
  )
}
