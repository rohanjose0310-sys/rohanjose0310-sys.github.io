import { Link } from 'react-router-dom'

interface PlaceholderPageProps {
  title: string
}

// Minimal shell for pages that don't exist yet (content supplied later).
export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <main
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
      }}
    >
      <h1 style={{ margin: 0 }}>{title}</h1>
      <p>Coming soon.</p>
      <Link to="/" style={{ color: 'var(--accent)' }}>
        ← Back home
      </Link>
    </main>
  )
}
