export interface GalleryImage {
  url: string
  /** The image's own write-up, rendered as the 3D <Text> beside its frame —
   *  keep it to ~2 short sentences. This is where a project's detail lives:
   *  the demo's layout puts a narrow text column next to every frame, and a
   *  DOM panel big enough for long-form copy would cover the frames behind it
   *  and make them unselectable. */
  caption: string
  position: [number, number, number]
  rotation: [number, number, number]
}

export interface Project {
  id: string
  title: string
  /** Small preview image shown in the hover card. */
  image: string
  tagline: string
  year: string
  role: string
  images: GalleryImage[]
}

// Frame layout ported verbatim from the pmndrs image-gallery demo
// (https://github.com/pmndrs/examples/blob/main/demos/image-gallery/src/index.jsx)
// — 1 front, 2 back, 3 left, 3 right. Only `url`/`caption` differ per project,
// so both projects below reuse this and just supply those two fields.
const GALLERY_LAYOUT: Array<Pick<GalleryImage, 'position' | 'rotation'>> = [
  // Front
  { position: [0, 0, 1.5], rotation: [0, 0, 0] },
  // Back
  { position: [-0.8, 0, -0.6], rotation: [0, 0, 0] },
  { position: [0.8, 0, -0.6], rotation: [0, 0, 0] },
  // Left
  { position: [-1.75, 0, 0.25], rotation: [0, Math.PI / 2.5, 0] },
  { position: [-2.15, 0, 1.5], rotation: [0, Math.PI / 2.5, 0] },
  { position: [-2, 0, 2.75], rotation: [0, Math.PI / 2.5, 0] },
  // Right
  { position: [1.75, 0, 0.25], rotation: [0, -Math.PI / 2.5, 0] },
  { position: [2.15, 0, 1.5], rotation: [0, -Math.PI / 2.5, 0] },
  { position: [2, 0, 2.75], rotation: [0, -Math.PI / 2.5, 0] },
]

// Placeholder frame photos — the existing /img1_.jpg … /img9_.jpg in public/.
// Swapping to public/projects/<id>/*.jpg later is a one-array edit here.
const PLACEHOLDER_URLS = Array.from({ length: 9 }, (_, i) => `/img${i + 1}_.jpg`)

// Solasphere: one real photo per GALLERY_LAYOUT slot, listed explicitly
// (rather than cycling a shorter array) so it's obvious which slot gets which
// photo. solasphere10.png (the build-day group photo, formerly at "right2")
// was a 224x299 source — too low-res to display sharp at any size, not a
// compression artifact — swapped for the hero shot used as the project's
// hover-card thumbnail instead, which is a real high-resolution photo.
const SOLASPHERE_URLS = [
  '/solasphere2.jpg', // front
  '/solasphere3.jpg', // back-left
  '/solasphere4.jpg', // back-right
  '/solasphere6.jpg', // left1
  '/solasphere7.jpg', // left2
  '/solasphere5.jpg', // left3 — closest/most prominent on the left
  '/solasphere9.jpg', // right1
  '/solasphere.jpg', // right2 — swapped from the too-low-res group photo
  '/solasphere12.jpg', // right3 — full installation shot (IMG_3681)
]

// Exiled: only 4 real photos exist, so they cycle across the 9
// GALLERY_LAYOUT slots (i % urls.length in gallery()).
const EXILED_URLS = [
  '/Exiled.png',
  '/Exiled2.png',
  '/Exiled3.png',
  '/Exiled4-2.png',
]

// Dream Parasite: only 5 real photos exist, so they cycle across the 9
// GALLERY_LAYOUT slots (i % urls.length in gallery()).
const NOVA_URLS = [
  '/Nova1.jpeg',
  '/Nova2.png',
  '/Nova3.png',
  '/Nova4.png',
  '/Nova5.jpeg',
]

function gallery(captions: string[], urls: string[] = PLACEHOLDER_URLS): GalleryImage[] {
  return GALLERY_LAYOUT.map((layout, i) => ({
    ...layout,
    url: urls[i % urls.length],
    caption: captions[i],
  }))
}

export const PROJECTS: Project[] = [
  {
    id: 'solasphere',
    title: 'Solasphere',
    image: '/solasphere.jpg',
    tagline: 'An immersive installation exploring the grief of environmental change within one’s home.',
    year: '2025',
    role: 'Installation & Spatial Design',
    // TODO(rohan): placeholder copy — replace with the real per-image write-ups
    images: gallery([
      'The branches were never trees, only the shapes trees leave behind. The room remembers a canopy it never had.',
      'She kneels where a floor used to be uncomplicated. The thicket grew up through the address, not around it.',
      'Every joint is bound with wire the way a wound is bound with gauze. Nothing here is healing, only held together.',
      'Light finds her the way it once found a window. The window is gone; the habit of looking for it is not.',
      'The house did not flood or burn. It just stopped being able to promise anything.',
      'Grief for a place is grief with nowhere to send flowers. So it grows a thicket instead.',
      'She built the branches herself, which is its own kind of mourning — making the loss physical so it can be entered.',
      'From outside it reads as a forest. From inside it reads as a floor plan that gave up pretending.',
      'The room is smaller than the grief and larger than the house. That is the whole of the installation.',
    ], SOLASPHERE_URLS),
  },
  {
    id: 'exiled',
    title: 'Exiled',
    image: '/exiled.jpg',
    tagline: 'A wanderer cast from every world that ever knew her name.',
    year: '2023',
    role: 'Design & Direction',
    // TODO(rohan): placeholder copy — replace with the real per-image write-ups
    images: gallery([
      'The last door she was allowed to close behind her. Everything after this was somebody else’s threshold.',
      'Light arrives here without being asked for. Nothing in the room has learned to use it yet.',
      'Her name survives only in the mouths of people who never met her. She has stopped correcting them.',
      'A shelter borrowed for one night and kept for a year. The walls never agreed to it.',
      'The corridor was measured in departures rather than metres. It has not ended yet.',
      'What she carried weighed less than what she left. That ratio never improved.',
      'The room kept her shape long after she stopped filling it. Dust settled around the outline.',
      'From far enough away every window looks like the one from home. This is the use of distance.',
      'Still exiled, and now fluent in it. The word stopped being a verdict somewhere around here.',
    ], EXILED_URLS),
  },
  {
    id: 'dream-parasite',
    title: 'Dream Parasite',
    image: '/dream-parasite.jpg',
    tagline: 'Something is living in the space between falling asleep and dreaming.',
    year: '2024',
    role: 'Concept & Visual Development',
    // TODO(rohan): placeholder copy — replace with the real per-image write-ups
    images: gallery([
      'First contact happens in the four seconds before sleep. Neither party remembers agreeing to it.',
      'The host sleeps well for the first time in months. That is the first symptom.',
      'A dream borrowed and returned slightly wrong. The edges no longer line up with the original.',
      'Hunger presents as déjà vu. The room repeats until something has eaten enough.',
      'It has no shape of its own, so it wears the architecture. Corners are the easiest thing to borrow.',
      'The second host was chosen for proximity, not appetite. Sleep is contagious in shared rooms.',
      'What it leaves behind is warmth in an empty chair. Residue is the only proof available.',
      'One dream fought back and briefly won. The furniture still shows where it happened.',
      'Still feeding, still unnamed. It has outlasted every host who tried to describe it.',
    ], NOVA_URLS),
  },
]

export function getProject(id: string | undefined): Project | undefined {
  return id ? PROJECTS.find((project) => project.id === id) : undefined
}
