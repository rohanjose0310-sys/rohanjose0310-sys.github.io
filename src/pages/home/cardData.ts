export interface CardDatum {
  id: string
  label: string
  route: string
  accent: string
}

export const CARDS: CardDatum[] = [
  { id: 'models', label: '3D Models', route: '/models', accent: '#7dd3fc' },
  { id: 'projects', label: 'Projects', route: '/projects', accent: '#c084fc' },
  { id: 'about', label: 'About', route: '/about', accent: '#fca5a5' },
  { id: 'contact', label: 'Contact', route: '/contact', accent: '#86efac' },
  { id: 'resume', label: 'Resume / CV', route: '/resume', accent: '#fcd34d' },
]
