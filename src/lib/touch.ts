// True on touch-primary devices (phones/tablets). Appending `?touch` to the
// URL forces it on, so mobile behavior can be debugged in a desktop browser.
export const IS_TOUCH =
  typeof window !== 'undefined' &&
  (window.matchMedia('(pointer: coarse)').matches || new URLSearchParams(window.location.search).has('touch'))

// Mirror the flag as a class so stylesheets can target touch devices with the
// exact same condition the JS uses (html.touch instead of a media query).
if (IS_TOUCH) document.documentElement.classList.add('touch')
