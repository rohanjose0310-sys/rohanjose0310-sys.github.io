import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AdaptiveSceneDpr } from '../../../three/AdaptiveSceneDpr'
import { GalleryScene } from './GalleryScene'
import { getProject } from '../projectData'
import './detail.css'

// Detail route for a single project: the 3D gallery, and nothing else on top of
// it but a way back. Each image's write-up lives in the scene, on the text
// column beside its own frame (GalleryImage.caption) — the way the demo lays
// it out. A DOM copy panel was tried here first and pulled: sized to be worth
// reading it sat over the frames behind it, which made those frames impossible
// to click and broke navigating through the set.

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const project = getProject(id)

  // No matching project (bad/stale link): bounce back to the gallery grid
  // rather than rendering an empty scene.
  if (!project) return <Navigate to="/projects" replace />

  return (
    <>
      <div className="scene-layer" style={{ background: '#191920' }}>
        <Canvas dpr={[1, 1.5]} camera={{ fov: 70, position: [0, 2, 15] }}>
          <color attach="background" args={['#191920']} />
          <fog attach="fog" args={['#191920', 0, 15]} />
          <AdaptiveSceneDpr />
          <Suspense fallback={null}>
            <GalleryScene images={project.images} />
          </Suspense>
        </Canvas>
      </div>
      {/* pointer-events are off for the whole block and re-enabled only on the
          link, so this can never eat a click meant for a frame behind it. */}
      <header className="detail-head">
        <Link to="/projects" className="detail-back">
          ← Projects
        </Link>
        <h1>{project.title}</h1>
        <p className="detail-meta">
          {project.year} · {project.role}
        </p>
        {project.story && (
          <Link to={`/projects/${project.id}/story`} className="detail-more">
            More information →
          </Link>
        )}
      </header>
    </>
  )
}
