import { Children, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BrandMark } from '../../components/ui/Logo'
import { useStore, store } from './store'
import { MODELS } from './modelData'

const container = {
  hidden: { opacity: 0, height: 0, transition: { staggerChildren: 0.05 } },
  show: {
    opacity: 1,
    height: 'auto',
    transition: { when: 'beforeChildren' as const, staggerChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: '100%' },
  show: { opacity: 1, y: 0 },
}

function List({ children, open }: { children: ReactNode; open: boolean }) {
  return (
    <motion.ul variants={container} initial="hidden" animate={open ? 'show' : 'hidden'}>
      {Children.map(children, (child) => (
        <li>
          <motion.div variants={item}>{child}</motion.div>
        </li>
      ))}
    </motion.ul>
  )
}

export function Overlay() {
  const state = useStore()
  const model = MODELS.find((m) => m.id === state.selectedId) ?? MODELS[0]
  const [lineA, lineB, lineC] = model.titleLines
  return (
    <>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        <Link to="/" className="corner-home">
          <BrandMark height={19.5} />
          <span>ROHAN JOSE</span>
        </Link>
        <div className="corner-cad">CAD — FUSION 360 / RHINO</div>
      </div>

      <nav className="model-menu">
        <h2>3d models</h2>
        <ul>
          {MODELS.map((m) => (
            <li key={m.id}>
              <button
                className={m.id === state.selectedId ? 'active' : undefined}
                onClick={() => (store.selectedId = m.id)}>
                {m.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="info">
        <h1>{model.numeral}</h1>
        <List open={state.open}>
          <h3>{lineA}</h3>
          <h3>{lineB}</h3>
          <h3>
            <span className="accent">{lineC}</span>
          </h3>
          <h4>{model.subtitle}</h4>
          <p className="tag">{model.tag}</p>
          <p>{model.description}</p>
        </List>
      </div>
    </>
  )
}
