// Contract with the inline script in index.html. That script can't live in the
// bundle: iOS 26 Safari reads the <body> background it sets at first paint, and
// the bundle hasn't run by then. See index.html for the full explanation.

export type PageTint = {
  /** Page background — what <body> paints and Safari falls back to. */
  bg: string
  /** Colour for the status bar / toolbar respectively. */
  top: string
  bottom: string
  scheme: 'light' | 'dark'
}

declare global {
  interface Window {
    __pageTheme?: (path: string) => void
    __pageTint?: (path: string) => PageTint
  }
}

export const pageTint = (path: string) => window.__pageTint?.(path)

export const applyPageTheme = (path: string) => window.__pageTheme?.(path)
