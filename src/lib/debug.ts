// Single gate for dev-only tooling (leva panel, perf overlays).
// Stripping debug tooling for production = grep for this flag + `from 'leva'`.
export const DEBUG = import.meta.env.DEV
