// Which routes are GPU-heavy, and how hard to back off when hand tracking runs.
//
// Kept as one table rather than a flag on each page so the relative cost of the
// scenes can be read and tuned in a single place.

/**
 * Routes whose scenes have no GPU headroom to spare:
 *
 *   /projects — EffectComposer with Bloom (9 mip levels) + a 970KB LUT, and no
 *               dpr cap of its own, so it renders all of that at full ratio
 *   /about    — two transmission materials (the lens and the glass card)
 *
 * Deliberately excluded:
 *   /models — also transmission-heavy, but that page opts out of dpr adaptation
 *     on purpose: softening the buffer "reads as permanent frost" there (see the
 *     comment in FrostedScene). It already caps itself at 1.5. Respect that
 *     rather than trading its whole look for framerate.
 *   / and the text pages — the carousel is a few textured planes; paying a
 *     sharpness cost there would buy nothing.
 */
export const HEAVY_ROUTES = new Set(['/projects', '/about'])

/**
 * Pixel-ratio multiplier applied on those routes while tracking is on.
 *
 * 0.7 on the ratio is ~half the pixels (cost scales with dpr²), which is the
 * usual difference between a heavy scene holding 60fps and sagging — while
 * staying well above the point where edges visibly soften on a 2x display.
 *
 * This is a proactive backoff, deliberately: drei's AdaptiveDpr only reacts
 * *after* frames have already been dropped, so it fixes a sag the visitor has
 * by then seen. Turning the camera on is a known, measurable cost, so it is
 * better paid up front.
 */
export const HAND_DPR_FACTOR = 0.7

export const isHeavyRoute = (pathname: string) => HEAVY_ROUTES.has(pathname)
