// Live hand-tracking overlay: mirrored camera feed, skeleton, pose readout and
// the calibration sliders.
//
// This stays visible while we tune thresholds against a real hand. Once the
// numbers settle it can drop to a much smaller badge (or nothing) — the panel
// is a calibration instrument, not the final design.
//
// It reads `hand` directly inside its own rAF loop rather than through React
// state: the whole reason store.ts splits hot data out of the valtio proxy is
// so a 22Hz landmark stream never triggers a render.

import { useEffect, useRef, useState } from 'react'
import { HAND_CONNECTIONS, LM, type Pose } from './types'
import { hand, handSettings, useHandSettings, useHandUI } from './store'
import { DEFAULT_THRESHOLDS } from './classify'
import { FILTER_OPTIONS } from './config'
import { useHandTracking } from './useHandTracking'
import './gestures.css'

const VIEW_WIDTH = 240
const VIEW_HEIGHT = 180

const POSE_LABEL: Record<Pose, string> = {
  none: '—',
  open_palm: 'OPEN PALM',
  fist: 'FIST',
  pinch: 'PINCH',
  point: 'POINT',
  peace: 'PEACE (back)',
  three: 'THREE (inert)',
}

export function HandOverlay() {
  const { tracker, start, stop } = useHandTracking()
  const ui = useHandUI()
  const settings = useHandSettings()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [tuning, setTuning] = useState({
    ...DEFAULT_THRESHOLDS,
    minCutoff: FILTER_OPTIONS.minCutoff,
    beta: FILTER_OPTIONS.beta,
  })

  useEffect(() => {
    tracker.retune(tuning)
  }, [tracker, tuning])

  // Draw loop. Runs whenever the panel is open, independent of the inference
  // rate — the filtered landmarks are already smooth between samples, so
  // painting at display rate is what makes the skeleton look continuous rather
  // than stepping at 22Hz.
  useEffect(() => {
    if (collapsed) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let raf = 0

    const draw = () => {
      raf = requestAnimationFrame(draw)
      const video = tracker.videoElement
      ctx.save()
      // Mirror the whole panel so it reads like a mirror, not a stranger's
      // hand. Landmarks are drawn in raw (un-mirrored) frame space, so this one
      // flip covers both the video and the skeleton.
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
      if (video && video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      } else {
        ctx.fillStyle = '#14161a'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      const lms = hand.landmarks
      if (lms) {
        const px = (i: number) => lms[i].x * canvas.width
        const py = (i: number) => lms[i].y * canvas.height

        ctx.lineWidth = 2
        ctx.strokeStyle = hand.pose === 'pinch' ? '#ff6a1f' : 'rgba(255,255,255,0.85)'
        ctx.beginPath()
        for (const [a, b] of HAND_CONNECTIONS) {
          ctx.moveTo(px(a), py(a))
          ctx.lineTo(px(b), py(b))
        }
        ctx.stroke()

        for (let i = 0; i < lms.length; i++) {
          const tip = i === LM.THUMB_TIP || i === LM.INDEX_TIP
          ctx.fillStyle = tip ? '#ff6a1f' : 'rgba(255,255,255,0.9)'
          ctx.beginPath()
          ctx.arc(px(i), py(i), tip ? 4 : 2.5, 0, Math.PI * 2)
          ctx.fill()
        }

        // The pinch measurement itself, drawn as the line being measured — far
        // easier to calibrate against than a bare number.
        ctx.strokeStyle = hand.pose === 'pinch' ? '#ff6a1f' : 'rgba(255,106,31,0.4)'
        ctx.lineWidth = 1.5
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(px(LM.THUMB_TIP), py(LM.THUMB_TIP))
        ctx.lineTo(px(LM.INDEX_TIP), py(LM.INDEX_TIP))
        ctx.stroke()
        ctx.setLineDash([])
      }
      ctx.restore()

      if (!lms) {
        ctx.fillStyle = 'rgba(255,255,255,0.45)'
        ctx.font = '11px ui-monospace, monospace'
        ctx.textAlign = 'center'
        ctx.fillText('no hand in frame', canvas.width / 2, canvas.height / 2)
      }
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [collapsed, tracker])

  const running = ui.status === 'running'

  // delegate and input size are baked into the landmarker at creation time, so
  // changing either means tearing it down and building a new one. Restarting
  // straight away keeps the panel honest: the numbers on screen always describe
  // the settings shown next to them.
  const restartWith = (patch: Partial<typeof handSettings>) => {
    Object.assign(handSettings, patch)
    if (ui.status !== 'running') return
    const source = ui.source
    stop()
    // The teardown terminates a worker and releases the camera; let those land
    // before asking for both again.
    setTimeout(() => start(source), 60)
  }

  return (
    <div className={`hand-overlay${collapsed ? ' is-collapsed' : ''}`}>
      <header>
        <span className={`hand-dot hand-dot--${ui.status}`} />
        <strong>HAND</strong>
        <span className="hand-status">{ui.status}</span>
        <button onClick={() => setCollapsed((c) => !c)} aria-label="Toggle panel">
          {collapsed ? '+' : '–'}
        </button>
      </header>

      {!collapsed && (
        <>
          <canvas ref={canvasRef} width={VIEW_WIDTH} height={VIEW_HEIGHT} />

          <div className="hand-readout">
            <Row label="pose" value={POSE_LABEL[ui.pose]} highlight={ui.pose !== 'none'} />
            <LiveRows split={tuning.fingerSplit} />
          </div>

          <div className="hand-actions">
            {running ? (
              <button onClick={stop}>Stop</button>
            ) : (
              <>
                <button onClick={() => start('camera')}>Camera</button>
                <button onClick={() => start('synthetic')}>Synthetic</button>
              </>
            )}
          </div>

          <div className="hand-runtime">
            <label>
              <span>delegate</span>
              <select
                value={settings.delegate}
                onChange={(e) => restartWith({ delegate: e.target.value as 'GPU' | 'CPU' })}
              >
                <option value="GPU">GPU (WebGL)</option>
                <option value="CPU">CPU</option>
              </select>
            </label>
            <label>
              <span>input px</span>
              <select
                value={settings.inferenceWidth}
                onChange={(e) => restartWith({ inferenceWidth: Number(e.target.value) })}
              >
                {[192, 256, 320, 448].map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>target Hz</span>
              <select
                value={settings.inferenceHz}
                // Rate alone needs no restart — the loop reads it every tick.
                onChange={(e) => (handSettings.inferenceHz = Number(e.target.value))}
              >
                {[12, 15, 18, 22, 30].map((hz) => (
                  <option key={hz} value={hz}>
                    {hz}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {ui.message && <p className="hand-message">{ui.message}</p>}

          {ui.source === 'synthetic' && running && (
            <p className="hand-hint">
              mouse = move · <kbd>F</kbd> fist · <kbd>P</kbd>/click pinch · <kbd>I</kbd> point ·{' '}
              <kbd>2</kbd> peace · <kbd>3</kbd> three · <kbd>H</kbd> out of frame
            </p>
          )}

          <details className="hand-tuning">
            <summary>calibration</summary>
            {/* The extended/curled boundary. Watch the curl bars below: set it
                between where a finger sits curled and where it sits extended. */}
            <Slider
              label="finger split"
              min={0.4}
              max={0.85}
              value={tuning.fingerSplit}
              onChange={(v) => setTuning((t) => ({ ...t, fingerSplit: v }))}
            />
            <Slider
              label="pinch on"
              min={0.1}
              max={0.8}
              value={tuning.pinchOn}
              onChange={(v) => setTuning((t) => ({ ...t, pinchOn: v }))}
            />
            <Slider
              label="pinch off"
              min={0.1}
              max={0.9}
              value={tuning.pinchOff}
              onChange={(v) => setTuning((t) => ({ ...t, pinchOff: v }))}
            />
            {/* How open the other fingers must be for a pinch to count. Raise it
                if closing a fist ever selects something; lower it if a relaxed
                pinch is being ignored. */}
            <Slider
              label="pinch open"
              min={0.3}
              max={0.95}
              value={tuning.pinchOpen}
              onChange={(v) => setTuning((t) => ({ ...t, pinchOpen: v }))}
            />
            {/* Below this the thumb counts as tucked, making a two-finger shape
                a peace sign (back) rather than an inert three. */}
            <Slider
              label="thumb tuck"
              min={0.15}
              max={0.8}
              value={tuning.thumbTucked}
              onChange={(v) => setTuning((t) => ({ ...t, thumbTucked: v }))}
            />
            <Slider
              label="minCutoff"
              min={0.1}
              max={5}
              step={0.05}
              value={tuning.minCutoff}
              onChange={(v) => setTuning((t) => ({ ...t, minCutoff: v }))}
            />
            <Slider
              label="beta"
              min={0}
              max={0.3}
              step={0.005}
              value={tuning.beta}
              onChange={(v) => setTuning((t) => ({ ...t, beta: v }))}
            />
          </details>
        </>
      )}
    </div>
  )
}

/**
 * The numbers that change every frame, polled off `hand` at display rate. Kept
 * in its own component so the re-render it causes can't touch the canvas or the
 * sliders above it.
 */
function LiveRows({ split }: { split: number }) {
  const [, force] = useState(0)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      force((n) => n + 1)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <>
      <Row label="pinch d" value={hand.pinchDistance.toFixed(3)} />
      {/* Low = thumb tucked across the palm (peace); high = thumb up (three). */}
      <Row label="thumb sp" value={hand.thumbSpread.toFixed(3)} />
      <Row label="span" value={hand.span.toFixed(3)} />
      <Row label="cursor" value={`${hand.x.toFixed(2)}, ${hand.y.toFixed(2)}`} />
      {/* Achieved vs target: when these diverge, inference is overrunning its
          budget and the loop is dropping frames to keep up. */}
      <Row
        label="rate"
        value={`${hand.fps}/${handSettings.inferenceHz} Hz · ${hand.inferenceMs.toFixed(1)} ms`}
        highlight={hand.fps > 0 && hand.fps < handSettings.inferenceHz - 2}
      />
      {/* Per-finger extension. Each bar is coloured by which side of the split
          it's on (orange = extended, grey = curled) with the split drawn as a
          line, and the number printed — so calibration is just "put the line
          between the curled fingers and the extended ones". */}
      <div className="hand-curls">
        {(['thumb', 'index', 'middle', 'ring', 'pinky'] as const).map((finger) => {
          const v = hand.curls[finger]
          return (
            <div key={finger} className="hand-curl">
              <span>{finger[0]}</span>
              <div className="hand-curl__bar">
                <i
                  className={v >= split ? 'is-ext' : 'is-cur'}
                  style={{ transform: `scaleY(${v.toFixed(3)})` }}
                />
                <u style={{ bottom: `${(split * 100).toFixed(0)}%` }} />
              </div>
              <b>{v.toFixed(2)}</b>
            </div>
          )
        })}
      </div>
    </>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`hand-row${highlight ? ' is-active' : ''}`}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  )
}

function Slider({
  label,
  min,
  max,
  step = 0.01,
  value,
  onChange,
}: {
  label: string
  min: number
  max: number
  step?: number
  value: number
  onChange: (v: number) => void
}) {
  return (
    <label className="hand-slider">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <b>{value.toFixed(3)}</b>
    </label>
  )
}
