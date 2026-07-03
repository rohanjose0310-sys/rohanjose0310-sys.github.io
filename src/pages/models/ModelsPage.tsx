import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SceneCanvasLayout } from '../../layout/SceneCanvasLayout'
import { ModelsScene } from './ModelsScene'
import { MODELS } from './modelData'

export function ModelsPage() {
  const [selectedId, setSelectedId] = useState(MODELS[0].id)
  const selected = MODELS.find((m) => m.id === selectedId) ?? MODELS[0]

  return (
    <>
      <SceneCanvasLayout>
        <ModelsScene model={selected} />
      </SceneCanvasLayout>

      <div
        style={{
          position: 'fixed',
          top: '2rem',
          left: '2rem',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          maxWidth: '16rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', letterSpacing: '-0.02em' }}>3D Models</h1>
          <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
            CAD work from Fusion 360 &amp; Rhino
          </p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {MODELS.map((m) => {
            const active = m.id === selectedId
            return (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  padding: '0.35rem 0.6rem',
                  borderLeft: `2px solid ${active ? '#9fd4ff' : 'transparent'}`,
                  color: active ? 'var(--text-h)' : 'var(--text)',
                  background: active ? 'rgba(159, 212, 255, 0.08)' : 'transparent',
                  transition: 'all 0.15s ease',
                  fontSize: '0.95rem',
                }}
              >
                {m.name}
              </button>
            )
          })}
        </nav>

        <Link to="/" style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>
          ← Back home
        </Link>
      </div>
    </>
  )
}
