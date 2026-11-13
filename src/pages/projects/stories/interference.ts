import type { ProjectStory } from '../story/types'

// Copy drawn from Rohan's D3 Design Research Compendium ("Interference",
// Luminous Litho, Nov 2026) and lightly tightened. No new claims.
// Photos: R. Jose unless noted, from the DRC's own image set.

const img = (name: string, alt: string) => ({ src: `/projects/interference/${name}.jpg`, alt })

export const INTERFERENCE_STORY: ProjectStory = {
  accent: '#7fd8ff',
  display: 'lexend',
  titleFill:
    'linear-gradient(100deg, #ffffff 0%, #ffffff 38%, #ff7a9a 52%, #ffd36b 60%, #7dffb0 68%, #7fd8ff 76%, #c69bff 86%, #ffffff 100%)',
  subtitle: 'A butterfly written in light: a 300 mm silicon wafer inside a 490 mm tunnel you look into.',
  hero: img('hero', 'The butterfly wafer inside the tunnel, lit from above, with the moiré backdrop behind it'),
  facts: [
    { label: 'Year', value: '2026' },
    { label: 'Studio', value: 'D3 Studio, RMIT, with Discovery to Device' },
    { label: 'Team', value: 'Luminous Litho: Yuyang Zou, Rohan Jose, Thom van Os, Maria Niño' },
    { label: 'My role', value: 'Prototyping, CAD, fabrication and integration' },
    { label: 'Installed', value: 'D2D foyer, from 6 November 2026' },
  ],
  blocks: [
    {
      kind: 'lead',
      text: 'Discovery to Device asked our studio to make visible a process that happens below the eye, inside sealed rooms, behind glass. We chose photolithography: writing with light on silicon.',
    },
    {
      kind: 'text',
      paragraphs: [
        'We asked how it might become understandable through a visual experience rather than an explanation, and how designers and scientists could work together seamlessly to get there.',
        'The research began with structural colour. A Morpho butterfly’s wing and a silicon wafer make colour the same way, through interference in structures close to the wavelength of light, not through pigment. That work led to a final drawing of one butterfly and 68 stars across D2D’s first 12-inch wafer, with a smallest feature of 2 µm.',
      ],
    },
    {
      kind: 'image',
      layout: 'full',
      image: img('installed-front', 'The tunnel on its plinth with the wafer glowing inside'),
      caption: 'Interference installed at D2D.',
    },

    { kind: 'chapter', number: '01', title: 'Below the eye' },
    {
      kind: 'split',
      image: img('cleanroom', 'The yellow-lit cleanroom at D2D'),
      caption: 'The yellow-lit cleanroom at D2D, RMIT City North.',
      heading: 'A process nobody sees',
      paragraphs: [
        'The facility’s work happens in yellow light, behind glass, at a scale no visitor can see. The lab processes are confidential, so we did not photograph the lithography, the dicing or the scientists at work.',
        'The piece had to show what the laboratory does instead of explaining it.',
      ],
    },
    {
      kind: 'grid',
      columns: 3,
      ratio: '3 / 4',
      images: [
        img('sample-wafer', 'A patterned sample wafer from D2D'),
        img('wafer-glove', 'A patterned wafer held in a gloved hand, throwing rainbow colour'),
        img('disc-test', 'A circular interference disc test on black'),
      ],
      caption:
        'A sample wafer from D2D given to the team to study structural colour; a test wafer in the hand; one of the interference disc tests.',
    },

    { kind: 'chapter', number: '02', title: 'Drawing with light' },
    {
      kind: 'text',
      columns: 2,
      paragraphs: [
        'Thom van Os and Maria Niño led the photolithography. They patterned test wafers at D2D to learn what the process could draw, moving through test patterns from line studies to wallpaper tiles between 29 September and 23 October.',
        'The team built its own patterning software in parallel, turning a drawing into an exposure file. The butterfly studies followed M.C. Escher’s Sky and Water I, and ended in a single final drawing for a 12-inch wafer.',
      ],
    },
    {
      kind: 'grid',
      columns: 2,
      ratio: '4 / 3',
      images: [
        img('software', 'The team’s patterning software filling a butterfly with line patterns'),
        img('pattern-tile', 'A tiled butterfly pattern in bright line fills'),
      ],
      caption: 'The patterning software turning a drawing into an exposure file, and a tiled butterfly study. Screenshots: T. van Os.',
    },
    {
      kind: 'image',
      layout: 'inset',
      image: img('final-drawing', 'The final butterfly drawing over a grid of stars'),
      caption: 'The final drawing for a 12-inch wafer. T. van Os and M. Niño.',
    },

    { kind: 'chapter', number: '03', title: 'How do you show a mirror?' },
    {
      kind: 'lead',
      text: 'My part began with a question of display. The answer was a 490 mm tunnel lying on its side, so visitors look in from the front.',
    },
    {
      kind: 'split',
      side: 'right',
      image: img('section', 'Side section of the tunnel showing the five layers'),
      caption: 'Side section, not to scale: light, black paper, wafer, black mesh, moiré backing.',
      heading: 'Five layers',
      paragraphs: [
        'A light hangs above the wafer at about 30°, so the butterflies reflect down onto black paper lining the floor, where the wires are hidden. Behind the wafer sit a black mesh and an RGB moiré backing, visible around the smaller wafer.',
        'I drew the tunnel from a concept sketch, then fixed the layer spacing in Fusion 360 from the viewing distance of about 1.6 m. Nothing moves, and nothing needs switching on but the light.',
      ],
    },
    {
      kind: 'split',
      image: img('render', 'Fusion 360 render of the slotted screen and the curled RGB backing'),
      caption: 'Fusion 360 render of the slotted screen and the curled RGB backing.',
      heading: 'One continuous line',
      paragraphs: [
        'Behind the wafer, a slotted screen and RGB stripes make colour that moves with the visitor: the same interference that colours the wafer, at body scale.',
        'The screen is 1.2 mm thick with 5 mm bars and slots, laser cut as one continuous line of 93 slots, so the line from my first assignment survives in the finished piece. The backing carries 5 mm red, green and blue stripes on an 80° curl about 180 mm behind the screen. The effect only appears in perspective, so I tested it from the viewing distance rather than in orthographic views.',
      ],
    },
    {
      kind: 'grid',
      columns: 3,
      ratio: '3 / 4',
      images: [
        img('laser-cut', 'The moiré screen being laser cut'),
        img('tunnel-prototype', 'An early tunnel prototype with the wafer inside'),
        img('assembly', 'The team assembling the tunnel'),
      ],
      caption: 'Laser cutting the screen; an early tunnel prototype; assembly in B50.',
    },

    { kind: 'chapter', number: '04', title: 'Light as the ending' },
    {
      kind: 'split',
      side: 'right',
      image: img('light-test', 'Testing the angle of the light over the wafer'),
      caption: 'Testing the angle of the light inside the tunnel.',
      heading: 'Finding the cast',
      paragraphs: [
        'Early tests used a torch at 30° above the wafer. The final piece keeps that idea: a 500 lumen flashlight, retrofitted to run from a 12 V adapter, replaces the display case’s own RGB light panel.',
        'Too much ambient light washes out the cast, so the floor is lined in black. I integrated the parts: the acrylic wafer stand, the mesh and backing spacing, the light position and the cable routing under the floor.',
      ],
    },
    {
      kind: 'image',
      layout: 'full',
      image: img('floor-cast', 'The butterflies cast as coloured light on the black paper floor'),
      caption: 'The butterflies cast as light on the black paper floor.',
    },

    { kind: 'chapter', number: '05', title: 'The visitor is the mechanism' },
    {
      kind: 'text',
      columns: 2,
      paragraphs: [
        'You look into a lit tunnel. A 300 mm silicon wafer, patterned at D2D with an amalgamation of butterflies and 68 stars, catches the light above it. Its butterflies land on the black paper below as coloured light, and reach your hand if you reach in. Behind the wafer, bands of red, green and blue travel across the moiré backing as you move.',
        'Photolithography is light through a mask onto a sensitive surface. Here the wafer is the mask, and the surface is the floor and the visitor. It is interactive without screens or sensors, so it never breaks and needs no instructions, and it reads at walking pace in a corridor as much as a gallery.',
      ],
    },
    {
      kind: 'stats',
      items: [
        { value: '300 mm', label: 'Wafer diameter' },
        { value: '2 µm', label: 'Smallest feature' },
        { value: '760,235', label: 'Lines' },
        { value: '93', label: 'Slots, one laser line' },
      ],
    },
    {
      kind: 'grid',
      columns: 2,
      ratio: '3 / 2',
      images: [
        img('butterfly-macro', 'Close-up of the butterfly pattern splitting light into a spectrum'),
        img('wafer-hand', 'The final wafer held in a gloved hand'),
      ],
      caption: 'The wafer up close, and in the hand.',
    },
    {
      kind: 'specs',
      heading: 'Specification',
      rows: [
        ['Tunnel', 'Ø490 mm, 400 mm long, acrylic'],
        ['Light', '500 lm flashlight above and in front of the wafer'],
        ['Wafer', '300 mm silicon, patterned by photolithography at D2D'],
        ['Mesh', 'Ø490 mm, 5 mm bars and slots'],
        ['Backing', 'RGB stripes on an 80° curl'],
        ['Tools', 'Fusion 360, Rhino, Illustrator, laser cutter'],
      ],
    },
    {
      kind: 'specs',
      heading: 'Who did what',
      rows: [
        ['Rohan Jose', 'Tunnel concept and geometry, CAD, stand, moiré screen and backing, light and cable integration, install'],
        ['Thom van Os', 'Photolithography: butterfly designs, test wafers, final drawing; research and lighting'],
        ['Maria Niño', 'Photolithography: butterfly designs, test wafers, final drawing; experimentation'],
        ['Yuyang Zou', 'Manufacturing'],
      ],
    },
    {
      kind: 'image',
      layout: 'full',
      image: img('wafer-tunnel', 'The wafer seen through the tunnel mouth with the moiré bands behind'),
      caption: 'Interference: the butterfly wafer inside the tunnel.',
    },
  ],
  credits:
    'Interference by Luminous Litho (Yuyang Zou, Rohan Jose, Thom van Os, Maria Niño). D3 Studio, RMIT, with Discovery to Device. Studio leads Chris Henschke and Tahl Sweica; lab advisor Mahta Monshipouri. Photos by Rohan Jose unless noted.',
}
