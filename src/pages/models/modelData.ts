export interface ModelDatum {
  id: string
  /** Menu label, top-left. */
  name: string
  /** Big numeral above the reveal list (Major Mono Display). */
  numeral: string
  /** Large stacked headline lines; the last one gets the outlined accent. */
  titleLines: [string, string, string]
  subtitle: string
  /** Mono badge — where the CAD work was done. */
  tag: string
  description: string
  /**
   * 'placeholder' renders the demo shoe as stand-in geometry.
   * 'glb' loads `url` — a real CAD export converted via obj2gltf + draco.
   */
  kind: 'placeholder' | 'glb'
  url?: string
  /** Extra base rotation applied under the idle float, per model. */
  rotation?: [number, number, number]
}

export const MODELS: ModelDatum[] = [
  {
    id: 'helmet',
    name: 'Visor : Two',
    numeral: '01',
    titleLines: ['VISOR :', '“TWO”', 'FULL SIZE'],
    subtitle: 'Full-size wearable prototype',
    tag: 'Fusion 360',
    description:
      'Full-size helmet assembly modeled in Fusion 360 for Digital Making for Innovation at RMIT — satin titanium shell, chrome hardware, and a bronze-tinted visor, exported straight from the CAD assembly.',
    kind: 'glb',
    url: '/models/helmet-transformed.glb',
    rotation: [-Math.PI / 2 + 0.04, 0, 0.35],
  },
  {
    id: 'radial-engine',
    name: 'Radial Engine',
    numeral: '02',
    titleLines: ['RADIAL', '“ENGINE”', 'ASSEMBLY'],
    subtitle: 'Multi-cylinder engine study',
    tag: 'Fusion 360',
    description:
      'A radial aircraft-engine assembly — satin-titanium crankcase and cylinders with glossy enamel accent hardware, modeled as a mechanical study and exported straight from the CAD assembly.',
    kind: 'glb',
    url: '/models/radial-engine.glb',
    rotation: [0.1, 0, 0],
  },
  {
    id: 'gear',
    name: 'Gear',
    numeral: '03',
    titleLines: ['SPUR', '“GEAR”', 'TRAIN'],
    subtitle: 'Motion transmission part',
    tag: 'Fusion 360',
    description:
      'Involute tooth profile cut from a parametric sketch, sized for a 3D-printed gear train. Placeholder copy — swapped for the real writeup when the CAD export lands.',
    kind: 'placeholder',
  },
  {
    id: 'capsule',
    name: 'Capsule',
    numeral: '04',
    titleLines: ['SEALED', '“CAPSULE”', 'SHELL'],
    subtitle: 'Enclosure concept',
    tag: 'Rhino',
    description:
      'A two-part pressure-fit shell blended from lofted sections. Placeholder copy — swapped for the real writeup when the CAD export lands.',
    kind: 'placeholder',
  },
  {
    id: 'housing',
    name: 'Housing',
    numeral: '05',
    titleLines: ['MOTOR', '“HOUSING”', 'MK.I'],
    subtitle: 'Functional prototype',
    tag: 'Rhino',
    description:
      'Ribbed housing with boss mounts and cable strain relief, modeled for FDM printing. Placeholder copy — swapped for the real writeup when the CAD export lands.',
    kind: 'placeholder',
  },
]
