export interface ModelDatum {
  id: string
  name: string
  /** Where the model came from — shown as a caption. */
  source: string
  /**
   * 'placeholder' renders parametric stand-in geometry.
   * 'glb' will load a compressed .glb from /models/<id>.glb once real
   * CAD exports are run through `gltfjsx --transform`.
   */
  kind: 'placeholder' | 'glb'
}

export const MODELS: ModelDatum[] = [
  { id: 'torus-knot', name: 'Torus Knot', source: 'placeholder', kind: 'placeholder' },
  { id: 'gear', name: 'Gear', source: 'placeholder', kind: 'placeholder' },
  { id: 'capsule', name: 'Capsule', source: 'placeholder', kind: 'placeholder' },
  { id: 'housing', name: 'Housing', source: 'placeholder', kind: 'placeholder' },
]
