export interface Project {
  id: string
  title: string
  /** Small preview image shown in the hover card. */
  image: string
}

// Placeholder images for now — swap `image` for real project shots when ready.
export const PROJECTS: Project[] = [
  { id: 'exiled', title: 'Exiled', image: '/exiled.jpg' },
  { id: 'dream-parasite', title: 'Dream Parasite', image: '/dream-parasite.jpg' },
]
