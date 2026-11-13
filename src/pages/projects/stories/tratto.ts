import type { ProjectStory } from '../story/types'

// Copy drawn from Rohan's CPF A4a + A4b folio "Alessi · Flip It · Tratto"
// (Oct 2026) and lightly tightened. No new claims. All photos R. Jose.

const img = (name: string, alt: string) => ({ src: `/projects/tratto/${name}.jpg`, alt })

export const TRATTO_STORY: ProjectStory = {
  accent: '#e30613',
  display: 'bodoni',
  subtitle: '“Stroke”: three kitchen tools for Alessi, drawn from the Colombina cutlery.',
  hero: img('hero', 'The Huon pine spatula head, its dark grain line sweeping across the blade'),
  facts: [
    { label: 'Year', value: '2026' },
    { label: 'Course', value: 'Complex Prototyping & Fabrication, RMIT' },
    { label: 'Brief', value: 'Assignment 4, “Flip It”: three tools for a real brand' },
    { label: 'Brand', value: 'Alessi, after Colombina by Doriana and Massimiliano Fuksas' },
    { label: 'Materials', value: 'Huon pine, 1.6 mm stainless steel, PLA, beeswax' },
  ],
  blocks: [
    {
      kind: 'lead',
      text: 'A wooden spatula, an egg flip and a ladle: one family, three materials and three processes, designed for Alessi.',
    },
    {
      kind: 'text',
      paragraphs: [
        'Alessi’s Colombina collection, by Doriana and Massimiliano Fuksas, is cutlery shaped around the gestures of eating. Flipping, stirring and scooping are gestures too, so the set borrows Colombina’s straight handle and widening face.',
        'The wooden spatula is carved from a single piece of Huon pine. The egg flip and ladle share one tapered timber handle, joined to a waterjet-cut steel blade and a 3D-printed bowl.',
      ],
    },
    {
      kind: 'image',
      layout: 'inset',
      image: img('set', 'The three tools laid side by side on white'),
      caption: 'Tratto: wooden spatula, egg flip and ladle.',
    },

    { kind: 'chapter', number: '01', title: 'Same handle, same flare' },
    {
      kind: 'specs',
      columns: ['Cue', 'The rule'],
      rows: [
        ['01 Handle', 'Straight, parallel-sided, squared-off end. One outline reused on all three.'],
        ['02 Flare', 'A narrow neck that opens into a widening face. The neck-to-face radius is the signature curve, identical across the set.'],
        ['03 Proportion', 'Handle, neck and face held in one ratio, even though each face is shaped for its task.'],
      ],
    },
    {
      kind: 'grid',
      columns: 2,
      ratio: '7 / 5',
      images: [img('drawing-ladle', 'Plan drawing of the ladle head'), img('drawing-egg-flip', 'Plan drawing of the egg flip head and neck')],
      caption: 'Stage 1 plan drawings: ladle head, and egg flip head and neck. First-angle projection, 1:1 on A3, drawn in Fusion.',
    },

    { kind: 'chapter', number: '02', title: 'The wooden spatula' },
    {
      kind: 'split',
      image: img('wood-hand', 'The Huon pine spatula held up'),
      caption: 'Huon pine, single piece, no joints.',
      heading: 'After the knife',
      paragraphs: [
        'At first I wanted it to look like the spoon in the set, but it wasn’t bold or unique enough for Alessi’s character. So I studied the Colombina knife: its curves, and its dynamic yet simple shape.',
        'I drew outlines on MDF with varying curves and slopes until I was happy with the elegance, then went to timber. I had planned on Tasmanian Oak, Maple or Beech, but fell for Huon pine’s warmer, paler colour and dense grain.',
      ],
    },
    {
      kind: 'grid',
      columns: 3,
      ratio: '9 / 16',
      images: [
        img('bandsaw', 'Cutting the blank on the bandsaw'),
        img('sanding', 'Shaping the head on the sander'),
        img('finishing', 'Hand finishing the spatula'),
      ],
      caption: 'Cutting 13 mm from the block, shaping, and hand finishing.',
    },
    {
      kind: 'text',
      paragraphs: [
        'I cut it to show the dark grain line wrapping around the head, so the grain flows from the thick handle to the thin head. I sanded by hand to around 320 grit, eased a subtle fillet along every edge for grip, and finished it with three coats of food-safe beeswax.',
      ],
    },

    { kind: 'chapter', number: '03', title: 'Subtracting is more elegant' },
    {
      kind: 'split',
      side: 'right',
      image: img('egg-flip', 'The stainless egg flip with its timber handle'),
      caption: 'The egg flip: waterjet-cut 1.6 mm stainless steel and Huon pine.',
      heading: 'The fork, without the prongs',
      paragraphs: [
        'I made around 15 CAD iterations of a face that echoed the Colombina fork, trying gaps that recalled its three prongs. None was elegant enough, so I took them all away. Left with just the fork’s silhouette, it whispered “Alessi” to me.',
        'The head and neck were waterjet cut, then filed, sanded from 240 to 800 grit and polished, four times over, to remove deep scratches. A Magna Bend set the angle.',
      ],
    },
    {
      kind: 'grid',
      columns: 3,
      ratio: '9 / 16',
      images: [
        img('grinding', 'Sanding the steel head'),
        img('bending', 'The steel neck clamped for bending'),
        img('handle', 'The timber handle with its saw slot'),
      ],
      caption: 'Sanding the head, bending the neck, slotting the handle.',
    },
    {
      kind: 'image',
      layout: 'wide',
      image: img('handle-joint', 'Close-up of the flush seam between timber handle and steel neck'),
      caption: 'Huon pine sawdust mixed into epoxy, sanded back until the steel edge shows: a flush seam.',
    },

    { kind: 'chapter', number: '04', title: 'A perfect circle' },
    {
      kind: 'split',
      image: img('ladle-side', 'The ladle in side profile'),
      caption: 'PLA head, stainless neck, Huon pine handle.',
      heading: 'Contrast within the family',
      paragraphs: [
        'A teardrop like the Colombina spoons would echo the drooping wooden spatula too closely. With no inner cutouts anywhere in the set, a large, perfect circle stands best beside the others. Its end matches the handle’s dimensions, so it reads bolder than a usual ladle.',
        'The bowl was printed on a Bambu FDM printer, then primed, filled and sanded over two days until no print line could be felt, before a beige top coat.',
      ],
    },
    {
      kind: 'grid',
      columns: 3,
      ratio: '9 / 16',
      images: [
        img('ladle-print', 'The printed ladle bowl on a stand'),
        img('spraying', 'Spray painting the bowl'),
        img('ladle-bowl', 'The painted ladle bowl'),
      ],
      caption: 'Print, prime and fill, top coat.',
    },
    {
      kind: 'specs',
      heading: 'Change log',
      columns: ['Dimension', 'v1', 'v2', 'Final'],
      rows: [
        ['Spatula handle length', '150 mm', '120 mm', '130 mm'],
        ['Spatula head width', '85 mm', '75 mm', '70 mm'],
        ['Egg flip neck width', '18 mm', '15 mm', '15 mm'],
        ['Ladle bowl depth', '20 mm', '—', '26.575 mm'],
        ['Ladle neck length', '120 mm', '110 mm', '100 mm'],
      ],
    },

    { kind: 'chapter', number: '05', title: 'The set' },
    {
      kind: 'image',
      layout: 'full',
      image: img('egg-flip-float', 'The egg flip floating in profile against white'),
    },
    {
      kind: 'grid',
      columns: 2,
      ratio: '3 / 2',
      images: [img('ladle-hand', 'The ladle held in the hand'), img('egg-flip-hand', 'The egg flip held in the hand')],
      caption: 'In the hand.',
    },
    {
      kind: 'quote',
      text: 'Semplificare è difficile. Simplifying is difficult.',
      cite: 'Bruno Munari',
    },
    {
      kind: 'text',
      heading: 'Reflection',
      paragraphs: [
        'Like the bottle opener, prototyping, testing and failing made the outcome better. When I wasn’t happy, I sat with it, slept on it and went back to the heart of the brand. It’s like scuba diving: every dive goes deeper. I put myself in the seat of a designer at Alessi and asked whether the design honoured their legacy.',
        'I also fell for timber. The technicians in Building 49 raved about Huon pine, smelling it and smiling. Their passion was infectious, and it pushed me to respect the material and skip no steps.',
      ],
    },
  ],
  credits:
    'Tratto. Complex Prototyping & Fabrication, RMIT, 2026. A student concept for Alessi, after the Colombina collection by Doriana and Massimiliano Fuksas; not affiliated with Alessi. Design, fabrication and photography by Rohan Jose.',
}
