import { useState, type FormEvent } from 'react'
import { BrandMark } from '../../components/ui/Logo'
import { ContactIntro } from './ContactIntro'
import { ShaderPanel } from './ShaderPanel'
import './contact.css'

const EMAIL = 'rohanjose0310@gmail.com'
const PHONE_DISPLAY = '0478 733 566'
const PHONE_TEL = '+61478733566'

// Formspree form ID (the 8-char slug from the endpoint URL, e.g. "xyzabcde").
// While empty, SEND falls back to opening a prefilled email draft instead.
const FORMSPREE_ID = 'mqereyan'

type SendState = 'idle' | 'sending' | 'sent' | 'error'

// Contact page: centered one-page form flanked by interactive shader panels
// bleeding off the edges. Submits via Formspree; mailto fallback until the
// form ID is configured.
export function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [sendState, setSendState] = useState<SendState>('idle')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!FORMSPREE_ID) {
      const subject = `Portfolio contact${name ? ` — ${name}` : ''}`
      const body = [message, '', name && `— ${name}`, email && `Email: ${email}`, phone && `Phone: ${phone}`]
        .filter(Boolean)
        .join('\n')
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      return
    }
    setSendState('sending')
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
          _subject: `Portfolio contact${name ? ` — ${name}` : ''}`,
        }),
      })
      if (!res.ok) throw new Error(`Formspree ${res.status}`)
      setSendState('sent')
      setName('')
      setEmail('')
      setPhone('')
      setMessage('')
    } catch {
      setSendState('error')
    }
  }

  return (
    <main className="contact-page">
      {/* Black/orange shader fills the viewport; the light tiles below slide up
          over it, leaving it exposed at the lower left and along the right. */}
      <ShaderPanel className="contact-shader" />
      <div className="contact-bg">
        <span className="contact-bg__inner" />
      </div>

      <ContactIntro />

      <span className="corner left">
        <BrandMark height={19.5} />
        Rohan Jose
      </span>
      <span className="corner right">Contact</span>

      <form className="contact-form" onSubmit={onSubmit}>
        <h1>Hello, nice to meet you!</h1>

        <label htmlFor="c-name">What&apos;s your name ?</label>
        <input id="c-name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />

        <label htmlFor="c-email">
          What&apos;s your email? <span className="req">*</span>
        </label>
        <input
          id="c-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="c-phone">What&apos;s your phone number?</label>
        <input
          id="c-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <h1 className="second">
          If your project could talk,
          <br />
          what would it say?
        </h1>

        <label htmlFor="c-message">
          Your message <span className="req">*</span>
        </label>
        <textarea
          id="c-message"
          name="message"
          required
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button type="submit" disabled={sendState === 'sending' || sendState === 'sent'}>
          {sendState === 'sending' ? 'Sending…' : sendState === 'sent' ? 'Sent ✓' : 'Send'}
        </button>
        {sendState === 'sent' && <p className="send-status">Thanks — I&apos;ll get back to you soon.</p>}
        {sendState === 'error' && (
          <p className="send-status error">
            Something went wrong — email me directly at <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
          </p>
        )}
      </form>

      <div className="panel-links">
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        <a href={`tel:${PHONE_TEL}`}>{PHONE_DISPLAY}</a>
      </div>
    </main>
  )
}
