// The long-form "More information" page for a project (/projects/:id/story).
//
// The 3D gallery at /projects/:id keeps its two-sentence captions; anything
// longer lives here, as an ordered list of blocks rendered top to bottom by
// StoryPage. The layout rules come from Rohan's DRC: one big typographic
// gesture per chapter, short line lengths, square photos, one caption per
// image group, no rules or kickers.

export interface StoryImage {
  src: string
  alt: string
}

export type StoryBlock =
  /** Chapter opener: a mono number and a giant display-face title. */
  | { kind: 'chapter'; number: string; title: string }
  /** Large intro paragraph, set in the display face. */
  | { kind: 'lead'; text: string }
  /** Body copy. `columns: 2` flows it into two short columns on wide screens. */
  | { kind: 'text'; heading?: string; paragraphs: string[]; columns?: 1 | 2 }
  /** One photo. full = edge to edge, wide = inside the margins, inset = 8 of 12 columns. */
  | { kind: 'image'; image: StoryImage; caption?: string; layout?: 'full' | 'wide' | 'inset' }
  /** Photo beside a text column. */
  | {
      kind: 'split'
      image: StoryImage
      caption?: string
      heading?: string
      paragraphs: string[]
      side?: 'left' | 'right'
    }
  /** 2–4 photos in a row, cropped to one shared aspect ratio. */
  | { kind: 'grid'; images: StoryImage[]; caption?: string; columns?: 2 | 3 | 4; ratio?: string }
  /** Big numbers with small mono labels. */
  | { kind: 'stats'; items: { value: string; label: string }[] }
  /** A mono spec table (or a before/after change log). */
  | { kind: 'specs'; heading?: string; columns?: string[]; rows: string[][] }
  | { kind: 'quote'; text: string; cite?: string }
  /** A lazy YouTube embed: a poster until clicked, so no iframe cost up front. */
  | { kind: 'video'; youtubeId: string; poster: string; caption?: string; vertical?: boolean }

export interface ProjectStory {
  /** Accent for the chapter numbers, captions and links. */
  accent: string
  /** Display face for titles, chapters and the lead. Everything else is the site's own type. */
  display: 'lexend' | 'bodoni' | 'cormorant'
  /** Optional CSS background for the hero title (e.g. a spectral or silver gradient). */
  titleFill?: string
  /** One line under the title. */
  subtitle: string
  hero: StoryImage
  facts: { label: string; value: string }[]
  blocks: StoryBlock[]
  /** Small print at the very end (photo credits, team credit). */
  credits?: string
}
