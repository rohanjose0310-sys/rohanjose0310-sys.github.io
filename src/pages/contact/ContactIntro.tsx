import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(CustomEase)
CustomEase.create('inOutCubic', '0.65, 0, 0.35, 1')

const LINES = ['Everything starts with', 'a good brief.']

// Opening sequence, mirroring leeroy.ca/en/contact:
//   1. the two title lines mask-reveal upward out of their overflow-hidden rows
//   2. they split apart vertically while scaling 2.5x — reads as flying past you
//   3. two seconds in, the light backdrop slides up from below in three tiles
//      (left + right together, centre 0.2s behind) to become the form surface
//
// Mounts inside .contact-page and drives that whole page's entrance.
export function ContactIntro() {
  const introRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const intro = introRef.current
    // Resolve the page from the intro itself — as a child, this layout effect
    // runs before the parent's own ref has been attached.
    const page = intro?.closest<HTMLElement>('.contact-page')
    if (!intro || !page) return

    const ctx = gsap.context(() => {
      const bg = page.querySelector<HTMLElement>('.contact-bg')
      const form = page.querySelector<HTMLElement>('.contact-form')
      const links = page.querySelector<HTMLElement>('.panel-links')
      const chrome = page.querySelectorAll<HTMLElement>('.corner, .back-link')
      const rows = intro.querySelectorAll<HTMLElement>('.contact-intro__line')
      const spans = intro.querySelectorAll<HTMLElement>('.contact-intro__line span')

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        intro.style.display = 'none'
        return
      }

      // Hold the assembled page off-screen until the timelines take over, so a
      // slow first paint can't flash the finished layout.
      gsap.set(bg, { '--bg-position': '101%', '--bg-center-position': '101%' })
      gsap.set([form, links], { opacity: 0 })
      gsap.set(chrome, { yPercent: -200 })

      const title = gsap.timeline()
      title
        .fromTo(spans, { yPercent: 115 }, { yPercent: 0, duration: 1, stagger: 0.08, ease: 'power3.out' })
        .to(rows[0], { y: '-80vh', scale: 2.5, ease: 'inOutCubic', duration: 2 })
        .to(rows[1], { y: '80vh', scale: 2.5, ease: 'inOutCubic', duration: 2 }, '<')
        .set(intro, { display: 'none' })

      const backdrop = gsap.timeline({ delay: 2 })
      backdrop
        .to(bg, { '--bg-position': '0%', ease: 'inOutCubic', duration: 1.5 })
        .to(bg, { '--bg-center-position': '0%', ease: 'inOutCubic', duration: 1.3 }, '>-1.3')
        .to(chrome, { yPercent: 0, ease: 'inOutCubic', duration: 1 }, '<0.4')
        .to(form, { opacity: 1, ease: 'inOutCubic', duration: 1.3 }, '>-0.5')
        .to(links, { opacity: 1, ease: 'inOutCubic', duration: 0.8 }, '>-0.1')
    }, page)
    return () => ctx.revert()
  }, [])

  return (
    <div className="contact-intro" ref={introRef} aria-hidden="true">
      <h1>
        {LINES.map((line) => (
          <div className="contact-intro__line" key={line}>
            <span>{line}</span>
          </div>
        ))}
      </h1>
    </div>
  )
}
