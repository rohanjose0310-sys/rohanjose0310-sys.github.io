import { useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { StoryBlock, StoryImage } from './types'

// One component per StoryBlock kind. `fig` is the figure number of the block's
// first image, assigned in reading order by StoryPage, so captions read
// "Fig. 07" or "Fig. 08–10" without numbering anything by hand.

const pad = (n: number) => String(n).padStart(2, '0')

function figLabel(fig: number, count: number) {
  return count > 1 ? `Fig. ${pad(fig)}–${pad(fig + count - 1)}` : `Fig. ${pad(fig)}`
}

/** Fade and rise on first entering the viewport. Static under reduced motion. */
export function Reveal({
  children,
  className,
  delay = 0,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'figure' | 'section'
}) {
  const reduce = useReducedMotion()
  const Tag = motion[as]
  if (reduce) return <Tag className={className}>{children}</Tag>
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Tag>
  )
}

function Img({ image, className }: { image: StoryImage; className?: string }) {
  return <img className={className} src={image.src} alt={image.alt} loading="lazy" decoding="async" />
}

function Caption({ fig, count, text }: { fig: number; count: number; text?: string }) {
  if (!text) return null
  return (
    <figcaption className="st-caption">
      <span className="st-fig">{figLabel(fig, count)}</span>
      {text}
    </figcaption>
  )
}

function Video({ block, fig }: { block: Extract<StoryBlock, { kind: 'video' }>; fig: number }) {
  const [playing, setPlaying] = useState(false)
  return (
    <Reveal as="figure" className={`st-video${block.vertical ? ' is-vertical' : ''}`}>
      <div className="st-video-frame">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${block.youtubeId}?autoplay=1&rel=0&playsinline=1`}
            title={block.caption ?? 'Project video'}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button type="button" className="st-video-poster" onClick={() => setPlaying(true)}>
            <img src={block.poster} alt="" loading="lazy" decoding="async" />
            <span className="st-play" aria-hidden="true" />
            <span className="sr-only">Play video</span>
          </button>
        )}
      </div>
      <Caption fig={fig} count={1} text={block.caption} />
    </Reveal>
  )
}

export function Block({ block, fig }: { block: StoryBlock; fig: number }) {
  switch (block.kind) {
    case 'chapter':
      return (
        <Reveal as="section" className="st-chapter">
          <span className="st-chapter-num">{block.number}</span>
          <h2 className="st-display st-chapter-title">{block.title}</h2>
        </Reveal>
      )

    case 'lead':
      return (
        <Reveal className="st-lead">
          <p className="st-display">{block.text}</p>
        </Reveal>
      )

    case 'text':
      return (
        <Reveal className={`st-text${block.columns === 2 ? ' is-cols' : ''}`}>
          {block.heading && <h3 className="st-display st-h3">{block.heading}</h3>}
          <div className="st-body">
            {block.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Reveal>
      )

    case 'image':
      return (
        <Reveal as="figure" className={`st-image is-${block.layout ?? 'wide'}`}>
          <Img image={block.image} />
          <Caption fig={fig} count={1} text={block.caption} />
        </Reveal>
      )

    case 'split':
      return (
        <section className={`st-split is-${block.side ?? 'left'}`}>
          <Reveal as="figure" className="st-split-media">
            <Img image={block.image} />
            <Caption fig={fig} count={1} text={block.caption} />
          </Reveal>
          <Reveal className="st-split-text" delay={0.12}>
            {block.heading && <h3 className="st-display st-h3">{block.heading}</h3>}
            <div className="st-body">
              {block.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </Reveal>
        </section>
      )

    case 'grid':
      return (
        <figure
          className="st-grid"
          style={{
            ['--cols' as string]: block.columns ?? block.images.length,
            ['--ratio' as string]: block.ratio ?? '4 / 5',
          }}
        >
          <div className="st-grid-row">
            {block.images.map((image, i) => (
              <Reveal key={image.src} delay={i * 0.08}>
                <Img image={image} />
              </Reveal>
            ))}
          </div>
          <Caption fig={fig} count={block.images.length} text={block.caption} />
        </figure>
      )

    case 'stats':
      return (
        <section className="st-stats">
          {block.items.map((item, i) => (
            <Reveal key={item.label} className="st-stat" delay={i * 0.08}>
              <span className="st-display st-stat-value">{item.value}</span>
              <span className="st-stat-label">{item.label}</span>
            </Reveal>
          ))}
        </section>
      )

    case 'specs':
      return (
        <Reveal className="st-specs">
          {block.heading && <h3 className="st-display st-h3">{block.heading}</h3>}
          <table>
            {block.columns && (
              <thead>
                <tr>
                  {block.columns.map((c) => (
                    <th key={c} scope="col">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) =>
                    j === 0 ? (
                      <th key={j} scope="row">
                        {cell}
                      </th>
                    ) : (
                      <td key={j}>{cell}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      )

    case 'quote':
      return (
        <Reveal as="figure" className="st-quote">
          <blockquote className="st-display">{block.text}</blockquote>
          {block.cite && <figcaption className="st-caption">{block.cite}</figcaption>}
        </Reveal>
      )

    case 'video':
      return <Video block={block} fig={fig} />
  }
}
