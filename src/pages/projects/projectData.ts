import type { ProjectStory } from './story/types'
import { INTERFERENCE_STORY } from './stories/interference'
import { FAUCON_STORY } from './stories/faucon'
import { TRATTO_STORY } from './stories/tratto'

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
  /** The long-form case study at /projects/:id/story. Projects without one
   *  hide the gallery's "More information" link. */
  story?: ProjectStory
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

// Interference: one photo per slot, from the DRC's image set.
const INTERFERENCE_URLS = [
  '/projects/interference/hero.jpg', // front
  '/projects/interference/butterfly-macro.jpg', // back-left
  '/projects/interference/wafer-glove.jpg', // back-right
  '/projects/interference/final-drawing.jpg', // left1
  '/projects/interference/render.jpg', // left2
  '/projects/interference/floor-cast.jpg', // left3
  '/projects/interference/installed-front.jpg', // right1
  '/projects/interference/moire-edge.jpg', // right2
  '/projects/interference/wafer-hand.jpg', // right3
]

const FAUCON_URLS = [
  '/projects/faucon/hero.jpg', // front
  '/projects/faucon/on-tie.jpg', // back-left
  '/projects/faucon/opening.jpg', // back-right
  '/projects/faucon/sketches-2.jpg', // left1
  '/projects/faucon/acrylic-bend.jpg', // left2
  '/projects/faucon/bend-spanner.jpg', // left3
  '/projects/faucon/box-closed.jpg', // right1
  '/projects/faucon/jeans.jpg', // right2
  '/projects/faucon/box-open.jpg', // right3
]

const TRATTO_URLS = [
  '/projects/tratto/set.jpg', // front
  '/projects/tratto/hero.jpg', // back-left
  '/projects/tratto/egg-flip.jpg', // back-right
  '/projects/tratto/drawing-egg-flip.jpg', // left1
  '/projects/tratto/sanding.jpg', // left2
  '/projects/tratto/spraying.jpg', // left3
  '/projects/tratto/ladle-side.jpg', // right1
  '/projects/tratto/handle-joint.jpg', // right2
  '/projects/tratto/wood-hand.jpg', // right3
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
  {
    id: 'interference',
    title: 'Interference',
    image: '/projects/interference/thumb.jpg',
    tagline: 'A butterfly-patterned silicon wafer inside a tunnel of light.',
    year: '2026',
    role: 'Prototyping & Integration · Luminous Litho',
    images: gallery([
      'A 300 mm silicon wafer, patterned at D2D, inside a 490 mm tunnel you look into. Nothing moves; the visitor is the mechanism.',
      'Butterfly wings and silicon make colour the same way: interference in structures close to the wavelength of light.',
      'A test wafer in the hand. Thom van Os and Maria Niño patterned these to learn what the process could draw.',
      'The final drawing: one butterfly and 68 stars across a 12-inch wafer, with a smallest feature of 2 µm.',
      'My Fusion 360 model of the slotted screen and curled RGB backing, spaced for a 1.6 m viewing distance.',
      'The light lands the butterflies on the black paper floor. Reach in and they land on your hand.',
      'Installed in the D2D foyer. The tunnel, stand, screen and integration were my part of the team’s work.',
      'Behind the wafer, 93 slots cut as one continuous laser line turn RGB stripes into moving bands.',
      'Writing with light on silicon, made where it is shown.',
    ], INTERFERENCE_URLS),
    story: INTERFERENCE_STORY,
  },
  {
    id: 'faucon',
    title: 'Le faucon pèlerin',
    image: '/projects/faucon/thumb.jpg',
    tagline: 'A stainless-steel bottle opener that clips to your tie.',
    year: '2026',
    role: 'Product Design & Fabrication',
    images: gallery([
      'Le faucon pèlerin, the peregrine falcon: a bottle opener that doubles as a tie clip, in polished stainless steel.',
      'Speed-form was the starting point: liquid metal, soft and elegantly curved corners.',
      'The wings become the pivot and fulcrum, borrowed from the geometry of a Swiss Army knife.',
      'Early sketches of swept silhouettes, before the opener stood up on its edge.',
      'Acrylic test clips, heat-bent by hand to find three angles that grip without snapping.',
      'The final steel, bent with a spanner and hammered to stretch the wing into a softer curve.',
      'A two-piece plywood box wrapped in black card, the name hand-written in silver.',
      'Opener and clip, worn on whatever you’re wearing.',
      'Inside: the falcon on a folded tie, and a hand-written letter describing the bird.',
    ], FAUCON_URLS),
    story: FAUCON_STORY,
  },
  {
    id: 'tratto',
    title: 'Tratto',
    image: '/projects/tratto/thumb.jpg',
    tagline: 'Three kitchen tools for Alessi, after the Colombina cutlery.',
    year: '2026',
    role: 'Product Design & Fabrication · Alessi concept',
    images: gallery([
      'Tratto, “stroke”: a wooden spatula, an egg flip and a ladle, designed as one family for Alessi.',
      'Huon pine, cut so the dark grain line wraps around the head and flows into the handle.',
      'The egg flip: the Colombina fork’s silhouette with the prongs taken away. Subtracting is more elegant.',
      'Plan drawings in first-angle projection, 1:1 on A3, drawn in Fusion.',
      'Shaping the spatula from a single block, refined by hand to 320 grit.',
      'The ladle’s printed bowl, primed, filled and sanded until no print line remained.',
      'A perfect circle: the one shape in the set with no echo of the others.',
      'Epoxy mixed with Huon pine sawdust, sanded back to a flush seam of steel and timber.',
      'Same handle, same flare. Three materials, one family.',
    ], TRATTO_URLS),
    story: TRATTO_STORY,
  },
]

export function getProject(id: string | undefined): Project | undefined {
  return id ? PROJECTS.find((project) => project.id === id) : undefined
}
