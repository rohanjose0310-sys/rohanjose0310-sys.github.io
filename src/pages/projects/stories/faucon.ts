import type { ProjectStory } from '../story/types'

// Copy drawn from Rohan's CPF Assignment 1 folio "Open It: Le faucon pèlerin"
// (Aug 2026) and lightly tightened. No new claims. All photos R. Jose.

const img = (name: string, alt: string) => ({ src: `/projects/faucon/${name}.jpg`, alt })

export const FAUCON_STORY: ProjectStory = {
  accent: '#c9ccd1',
  display: 'cormorant',
  titleFill: 'linear-gradient(170deg, #ffffff 0%, #8d9097 30%, #f4f5f7 48%, #6c6f75 66%, #e6e7ea 100%)',
  subtitle: 'The peregrine falcon: a polished stainless-steel bottle opener that clips to your tie.',
  hero: img('hero', 'The stainless-steel falcon resting on a folded tie inside its black box'),
  facts: [
    { label: 'Year', value: '2026' },
    { label: 'Course', value: 'Complex Prototyping & Fabrication, RMIT' },
    { label: 'Brief', value: 'Assignment 1, “Open It”: a bottle opener' },
    { label: 'Role', value: 'Solo: design, fabrication, packaging' },
    { label: 'Material', value: 'Stainless steel, hand bent and polished; plywood and black card box' },
  ],
  blocks: [
    {
      kind: 'lead',
      text: 'I fell in love with the liquid-metal style of speed-form, with soft and elegantly curved corners. I’ve always wanted to make something functional, dual-purpose and elegant.',
    },
    {
      kind: 'image',
      layout: 'full',
      image: img('on-tie', 'Close-up of the polished falcon on a textured tie'),
    },

    { kind: 'chapter', number: '01', title: 'Speed-form and birds' },
    {
      kind: 'split',
      image: img('sketches-2', 'Pencil sketches of swept, speed-form silhouettes'),
      caption: 'Speed-form sketches.',
      heading: 'From flat to vertical',
      paragraphs: [
        'I drew various birds for a flat bottle-opener shape, designed around the standardised bottle-cap dimensions. At this point I hadn’t considered a tie clip at all. For a vertical opener, I used my Swiss Army knife’s dimensions and shape as inspiration.',
        'After testing flat openers, the design wasn’t beautiful enough. I wanted something more minimalist, subtle and elegant.',
      ],
    },
    {
      kind: 'grid',
      columns: 3,
      ratio: '9 / 16',
      images: [
        img('paper-model', 'A paper bird model on a desk mat'),
        img('paper-model-2', 'A second paper bird model with long wings'),
        img('laser', 'Laser cutting MDF models'),
      ],
      caption: 'Paper models, then laser-cut MDF.',
    },
    {
      kind: 'text',
      paragraphs: [
        'I liked the long wings and wanted to emphasise them. Looking back at my Swiss Army knife, I realised I could build the wings into the curvature of the pivot and fulcrum. So I changed the form completely, from a flat opener to a vertical one, and removed the opener gap in the middle of the bird, which had made it structurally weak.',
      ],
    },

    { kind: 'chapter', number: '02', title: 'Why not a tie clip?' },
    {
      kind: 'quote',
      text: 'Why don’t I use the bend requirement functionally, and make it snap onto clothing?',
      cite: 'The eureka moment, getting dressed in a three-piece suit with no tie',
    },
    {
      kind: 'split',
      side: 'right',
      image: img('acrylic-bend', 'Heat-bending an acrylic test model by hand'),
      caption: 'Heat-bending an acrylic test clip.',
      heading: 'Three bends',
      paragraphs: [
        'I used the full 150 mm width allowed to add the clip, and laser cut it in acrylic to test whether it would sit snug on my clothing.',
        'I marked three bend points: two to stop the clip breaking off, a sharper angle for the first and a wider one for the second, and a final bend so the end doesn’t catch on clothes. I made more models with slightly different angles to find how far I could go without breaking it.',
      ],
    },
    {
      kind: 'split',
      image: img('acrylic-test', 'An acrylic model opening a bottle'),
      caption: 'Testing the fulcrum and pivot on a real cap.',
      heading: 'Upside down, and better',
      paragraphs: [
        'I first gave it two fulcrums and two pivots so it worked in both directions, but the fulcrum kept snapping off. Comparing it with my Swiss Army knife, I moved the pivot closer to the centre top of the cap.',
        'Then a revelation: with one fulcrum gone, the tail read as a bird’s head. It looked like a bird upside down, and it looked far better. In CAD I removed the mirrored tail, filleted the curves and refined it.',
      ],
    },
    {
      kind: 'image',
      layout: 'inset',
      image: img('cad', 'The final falcon profile in CAD'),
      caption: 'The final profile.',
    },

    { kind: 'chapter', number: '03', title: 'Steel, by hand' },
    {
      kind: 'grid',
      columns: 4,
      ratio: '9 / 16',
      images: [
        img('filing', 'Filing the edges of the steel blank'),
        img('bend-vise', 'The steel clamped in a vise for bending'),
        img('bend-spanner', 'Bending the clip with a spanner'),
        img('polishing', 'Polishing on a buffing wheel'),
      ],
      caption: 'Filing, bending in the vise, bending with a spanner, buffing.',
    },
    {
      kind: 'text',
      columns: 2,
      paragraphs: [
        'I filed the corners and edges with a hand file, sanded them a little, then wet-sanded both faces from 400 to 1200 grit.',
        'As with the acrylic, I marked three bend points on masking paper. I bent the sharp angles with a spanner held in place, and for the point where the wing becomes the clip I clamped it and hammered the bend, almost stretching it to give a softer, more rounded curve.',
        'The finish after bending wasn’t great and I had scratched it while hammering, so I re-sanded and polished with both coarse and fine buffing wheels.',
      ],
    },

    { kind: 'chapter', number: '04', title: 'The unboxing' },
    {
      kind: 'split',
      side: 'right',
      image: img('box-open', 'The open box with the falcon and a folded tie'),
      caption: 'The two-piece box, with the tie and the handwritten letter.',
      heading: 'A small, big moment',
      paragraphs: [
        'High-end jewellery and smartphone brands treat feel, weight and unboxing as part of the product. Jewellery packaging is subtle, minimalist, handwritten and soft to the touch.',
        'I designed a simple two-piece box with a false floor and a cutout to stuff the tie into, laser cut it from plywood and covered every visible surface in 300 gsm black card. I hand-wrote the name “Le faucon pèlerin” in silver gel pen in cursive, and added a handwritten letter describing the bird.',
      ],
    },
    {
      kind: 'grid',
      columns: 2,
      ratio: '3 / 2',
      images: [img('box-closed', 'The closed black box with the name in silver script'), img('tie-detail', 'The falcon clipped to the tie in the box')],
    },
    {
      kind: 'grid',
      columns: 2,
      ratio: '3 / 2',
      images: [img('opening', 'The falcon opening a bottle'), img('jeans', 'The falcon clipped to a jeans pocket')],
      caption: 'Opener and clip.',
    },
    {
      kind: 'video',
      youtubeId: 'nhY0wBUSvO0',
      poster: '/projects/faucon/jacket.jpg',
      vertical: true,
      caption: 'Le faucon pèlerin in use.',
    },
    {
      kind: 'text',
      heading: 'What it taught me',
      paragraphs: [
        'I already knew Rhino, Fusion and laser cutting, but taking a design from concept to refinement, then bending stainless steel and sanding in one direction before switching grit in another, was new. I can now look at steel products in shops and understand how they were bent and finished.',
        'Making mistakes and stress-testing was crucial. Acrylic snapping and MDF tearing during bending showed me how to improve the design, visually and functionally.',
      ],
    },
  ],
  credits: 'Le faucon pèlerin. Complex Prototyping & Fabrication, RMIT, 2026. Design, fabrication, packaging and photography by Rohan Jose.',
}
