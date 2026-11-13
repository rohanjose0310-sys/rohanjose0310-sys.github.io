import { useEffect, useRef, type CSSProperties } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { PROJECTS, getProject } from '../projectData'
import { Block } from './blocks'
import { figureCount } from './figures'
import './story.css'

// /projects/:id/story — the long-form case study behind a project's gallery.
// One template for every project; each story swaps only its accent, display
// face and content (see types.ts). Scrolls the document, so the app-wide
// Lenis instance (RootLayout) smooths it.

const DISPLAY_FONTS = {
  lexend: "'Lexend', var(--sans)",
  bodoni: "'Bodoni Moda', Didot, serif",
  cormorant: "'Cormorant Garamond', Georgia, serif",
}

export function StoryPage() {
  const { id } = useParams<{ id: string }>()
  const project = getProject(id)
  const story = project?.story
  const reduce = useReducedMotion()
  const hero = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: hero, offset: ['start start', 'end start'] })
  const heroScale = useTransform(scrollYProgress, [0, 1], [1.08, 1])
  const heroFade = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  // A fresh story starts at the top — including when "Next project" swaps the
  // :id under the same mounted page.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  if (!project || !story) return <Navigate to={project ? `/projects/${project.id}` : '/projects'} replace />

  const withStories = PROJECTS.filter((p) => p.story)
  const next = withStories[(withStories.indexOf(project) + 1) % withStories.length]

  // Figure number of each block's first image, in reading order.
  const numbered = story.blocks.reduce<{ block: (typeof story.blocks)[number]; fig: number }[]>((acc, block) => {
    const prev = acc[acc.length - 1]
    acc.push({ block, fig: prev ? prev.fig + figureCount(prev.block) : 1 })
    return acc
  }, [])

  const vars = {
    '--st-accent': story.accent,
    '--st-display': DISPLAY_FONTS[story.display],
    '--st-title-fill': story.titleFill ?? 'none',
  } as CSSProperties

  return (
    <article className={`story is-${story.display}`} style={vars}>
      <nav className="st-nav">
        <Link to={`/projects/${project.id}`}>← Gallery</Link>
        <Link to="/projects">All projects</Link>
      </nav>

      <header className="st-hero" ref={hero}>
        <motion.img
          className="st-hero-img"
          src={story.hero.src}
          alt={story.hero.alt}
          style={reduce ? undefined : { scale: heroScale }}
          fetchPriority="high"
        />
        <div className="st-hero-shade" aria-hidden="true" />
        <motion.div className="st-hero-copy" style={reduce ? undefined : { opacity: heroFade }}>
          <p className="st-kicker">{project.role}</p>
          <h1 className={`st-display st-title${story.titleFill ? ' is-filled' : ''}`}>{project.title}</h1>
          <p className="st-subtitle">{story.subtitle}</p>
        </motion.div>
      </header>

      <section className="st-facts" aria-label="Project facts">
        {story.facts.map((f) => (
          <div key={f.label} className="st-fact">
            <span className="st-fact-label">{f.label}</span>
            <span className="st-fact-value">{f.value}</span>
          </div>
        ))}
      </section>

      <div className="st-flow">
        {numbered.map(({ block, fig }, i) => (
          <Block key={i} block={block} fig={fig} />
        ))}
      </div>

      <footer className="st-foot">
        {story.credits && <p className="st-credits">{story.credits}</p>}
        {next && next !== project && (
          <Link to={`/projects/${next.id}/story`} className="st-next">
            <span className="st-kicker">Next project</span>
            <span className="st-display st-next-title">{next.title} →</span>
          </Link>
        )}
        <Link to={`/projects/${project.id}`} className="st-back">
          ← Back to the {project.title} gallery
        </Link>
      </footer>
    </article>
  )
}
