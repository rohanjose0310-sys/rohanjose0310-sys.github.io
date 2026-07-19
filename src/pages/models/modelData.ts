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
   * 'placeholder' renders no geometry (just the frosted lens over the studio).
   * 'glb' loads `url` — a real CAD export converted via obj2gltf + draco.
   */
  kind: 'placeholder' | 'glb'
  url?: string
  /** Extra base rotation applied under the idle float, per model. */
  rotation?: [number, number, number]
  /**
   * Uniform material override for single-material CAD parts (see GlbModel).
   * 'chrome' = mirror silver, 'steel' = polished machined steel. Omit to keep
   * the name-based material upgrade (helmet, radial engine).
   */
  finish?: 'chrome' | 'steel'
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
    // Star face lies in the model's X–Z plane; tilt ~90° about X so the
    // cylinders radiate toward the camera instead of being seen edge-on.
    rotation: [-Math.PI / 2, 0, 0],
  },
  {
    id: 'wheel-rim',
    name: 'Wheel Rim',
    numeral: '03',
    titleLines: ['ALLOY', '“WHEEL”', 'RIM'],
    subtitle: 'Performance alloy wheel',
    tag: 'Fusion 360',
    description:
      'A multi-spoke performance wheel rim turned in chrome silver — a polished automotive study modeled in Fusion 360 and exported straight from the CAD assembly.',
    kind: 'glb',
    url: '/models/wheel-rim.glb',
    finish: 'chrome',
    // Wheel face lies in the X–Z plane (axle along Y); tilt ~90° about X so the
    // spokes face the camera, with a small skew for a three-quarter view.
    rotation: [-Math.PI / 2, 0, 0.2],
  },
  {
    id: 'bevel-gear',
    name: 'Bevel Gear',
    numeral: '04',
    titleLines: ['HELICAL', '“BEVEL”', 'GEAR'],
    subtitle: 'Right-angle drive gear',
    tag: 'Fusion 360',
    description:
      'A helical bevel gear machined in satin steel, its curved teeth meshing at a right angle for smooth, quiet power transmission — exported straight from the CAD assembly.',
    kind: 'glb',
    url: '/models/bevel-gear.glb',
    finish: 'steel',
    rotation: [0, 0, 0],
  },
  {
    id: 'gear-slider',
    name: 'Gear Slider',
    numeral: '05',
    titleLines: ['GEAR', '“SLIDER”', 'ASSEMBLY'],
    subtitle: 'Linear motion mechanism',
    tag: 'Fusion 360',
    description:
      'A gear-driven slider that converts rotation into linear travel, machined in satin steel as a mechanism study and exported straight from the CAD assembly.',
    kind: 'glb',
    url: '/models/gear-slider.glb',
    finish: 'steel',
    rotation: [0, 0, 0],
  },
  {
    id: 'gravity-hook',
    name: 'Gravity Hook',
    numeral: '06',
    titleLines: ['GRAVITY', '“HOOK”', 'CATCH'],
    subtitle: 'Self-locking catch',
    tag: 'Fusion 360',
    description:
      'A gravity-actuated locking hook in satin steel — a compact hardware study modeled in Fusion 360 and exported straight from the CAD assembly.',
    kind: 'glb',
    url: '/models/gravity-hook.glb',
    finish: 'steel',
    rotation: [-Math.PI / 2, 0, 0],
  },
]
