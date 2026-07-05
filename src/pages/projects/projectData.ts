export interface Project {
  id: string
  title: string
  /** Small preview image shown in the hover card. */
  image: string
}

// Placeholder images for now — swap `image` for real project shots when ready.
export const PROJECTS: Project[] = [
  { id: 'exiled', title: 'Exiled', image: '/img5_.jpg' },
  { id: 'nova-worm', title: 'Nova Worm', image: '/img7_.jpg' },
]
