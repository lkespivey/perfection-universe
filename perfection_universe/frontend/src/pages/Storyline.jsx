import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { sound } from '../utils/sound'
import client from '../api/client'

// ── Glitch text effect ────────────────────────────────────
const GLITCH_CHARS = '█▓▒░╔╗╚╝║═╠╣╦╩╬▀▄■□▪▫'
function glitchText(text) {
  return text.split('').map(char =>
    Math.random() < 0.08
      ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
      : char
  ).join('')
}

function GlitchContent({ text }) {
  const [displayed, setDisplayed] = useState(text)
  useEffect(() => {
    const iv = setInterval(() => {
      setDisplayed(glitchText(text))
      setTimeout(() => setDisplayed(text), 80)
    }, 2500 + Math.random() * 3000)
    return () => clearInterval(iv)
  }, [text])
  return <span style={{ fontFamily: 'monospace' }}>{displayed}</span>
}

// ── Redaction bars ────────────────────────────────────────
function RedactedContent({ content }) {
  const lines = content.split('\n')
  return (
    <div style={{ fontFamily: 'monospace', lineHeight: 2 }}>
      {lines.map((line, i) => (
        <div key={i}>
          {line.trim() === '' ? (
            <br />
          ) : Math.random() < 0.55 ? (
            <span style={{
              background: 'rgba(20,15,10,0.95)',
              color: 'rgba(20,15,10,0.95)',
              padding: '0 4px',
              letterSpacing: '0.1em',
              userSelect: 'none',
              borderRadius: '2px',
            }}>
              {line}
            </span>
          ) : (
            <span style={{ color: 'rgba(220,200,180,0.7)' }}>{line}</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Type badge ────────────────────────────────────────────
const TYPE_STYLES = {
  log: { label: 'LOG', color: 'rgba(200,160,255,0.8)', border: 'rgba(200,160,255,0.25)' },
  transmission: { label: 'TRANSMISSION', color: 'rgba(120,200,255,0.8)', border: 'rgba(120,200,255,0.25)' },
  system_alert: { label: 'SYSTEM ALERT', color: 'rgba(255,180,80,0.8)', border: 'rgba(255,180,80,0.25)' },
  recovered_file: { label: 'RECOVERED FILE', color: 'rgba(100,255,180,0.8)', border: 'rgba(100,255,180,0.25)' },
  redacted: { label: 'REDACTED', color: 'rgba(255,80,80,0.8)', border: 'rgba(255,80,80,0.25)' },
}

const AUTHOR_COLORS = {
  PERFECTION: 'rgba(200,160,255,0.9)',
  SIGNAL: 'rgba(120,200,255,0.9)',
  SYSTEM: 'rgba(255,180,80,0.9)',
}

// ── Single file card ──────────────────────────────────────
function FileCard({ entry, side, index }) {
  const [open, setOpen] = useState(false)
  const typeStyle = TYPE_STYLES[entry.entry_type] || TYPE_STYLES.log
  const authorColor = AUTHOR_COLORS[entry.author] || 'rgba(200,200,200,0.9)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5 }}
      style={{ marginBottom: '12px' }}
    >
      <div
        onClick={() => { setOpen(!open); sound.click() }}
        style={{
          borderRadius: '10px',
          border: `1px solid ${open ? typeStyle.border : 'rgba(255,255,255,0.07)'}`,
          background: open
            ? `rgba(${side === 'left' ? '200,160,255' : '120,200,255'},0.05)`
            : 'rgba(255,255,255,0.03)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          overflow: 'hidden',
        }}
      >
        {/* Card header */}
        <div style={{
          padding: '14px 16px',
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: '12px',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.5rem', letterSpacing: '0.18em',
                color: typeStyle.color,
                border: `1px solid ${typeStyle.border}`,
                padding: '2px 7px', borderRadius: '4px',
                whiteSpace: 'nowrap',
              }}>
                [{typeStyle.label}]
              </span>
              {entry.stardate && (
                <span style={{ fontSize: '0.5rem', letterSpacing: '0.12em', color: 'rgba(200,180,160,0.35)' }}>
                  {entry.stardate}
                </span>
              )}
              <span style={{ fontSize: '0.5rem', letterSpacing: '0.12em', color: authorColor }}>
                {entry.author}
              </span>
            </div>
            <p style={{
              margin: 0, fontSize: '0.82rem', letterSpacing: '0.06em',
              color: open ? 'rgba(230,220,210,0.95)' : 'rgba(200,185,170,0.7)',
              fontFamily: 'monospace',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {entry.is_corrupted ? '▓▒░ ' : ''}{entry.title}
            </p>
          </div>
          <span style={{
            fontSize: '0.7rem', color: 'rgba(200,180,160,0.3)',
            flexShrink: 0, marginTop: '2px',
          }}>
            {open ? '▼' : '▶'}
          </span>
        </div>

        {/* Card body */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                padding: '0 16px 18px',
                borderTop: `1px solid ${typeStyle.border}`,
                paddingTop: '16px',
                fontSize: '0.82rem',
                lineHeight: 1.95,
                color: 'rgba(215,205,190,0.78)',
                fontFamily: 'monospace',
                letterSpacing: '0.04em',
                whiteSpace: 'pre-wrap',
              }}>
                {entry.is_redacted ? (
                  <RedactedContent content={entry.content} />
                ) : entry.is_corrupted ? (
                  <GlitchContent text={entry.content} />
                ) : (
                  entry.content
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ── Locked entry placeholder ──────────────────────────────
function LockedCard({ marsRequired }) {
  return (
    <div style={{
      marginBottom: '12px',
      padding: '14px 16px',
      borderRadius: '10px',
      border: '1px solid rgba(255,255,255,0.05)',
      background: 'rgba(0,0,0,0.2)',
      opacity: 0.4,
      cursor: 'not-allowed',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '0.7rem', color: 'rgba(255,120,80,0.6)' }}>🔒</span>
        <span style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: 'rgba(200,180,160,0.4)', fontFamily: 'monospace' }}>
          CLASSIFIED — MARS STAGE {marsRequired} REQUIRED
        </span>
      </div>
    </div>
  )
}

// ── Act panel ─────────────────────────────────────────────
function ActPanel({ act, marsStage }) {
  // Pair entries into rows — PERFECTION on left, SIGNAL on right when signal_version exists
  // Otherwise just left
  const entries = act.entries || []

  // Build dual-column rows
  const rows = entries.map(entry => ({
    left: entry.author !== 'SIGNAL' ? entry : null,
    right: entry.author !== 'SIGNAL' && entry.signal_version
      ? {
          ...entry,
          content: entry.signal_version,
          author: 'SIGNAL',
          entry_type: 'transmission',
          title: `${entry.title} [SIGNAL RECORD]`,
        }
      : entry.author === 'SIGNAL'
      ? entry
      : null,
    leftEntry: entry,
  }))

  return (
    <div>
      {act.description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            margin: '0 0 32px',
            fontSize: '0.8rem', letterSpacing: '0.08em',
            color: 'rgba(200,185,170,0.45)', lineHeight: 1.9,
            fontStyle: 'italic', fontFamily: 'monospace',
            borderLeft: '2px solid rgba(200,180,160,0.15)',
            paddingLeft: '16px',
          }}
        >
          {act.description}
        </motion.p>
      )}

      {entries.length === 0 && (
        <p style={{ color: 'rgba(200,185,170,0.3)', fontSize: '0.8rem', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
          NO ENTRIES RECOVERED.
        </p>
      )}

      {/* Dual column layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        alignItems: 'start',
      }}>
        {/* Left — PERFECTION */}
        <div>
          <div style={{
            marginBottom: '16px', paddingBottom: '8px',
            borderBottom: '1px solid rgba(200,160,255,0.15)',
          }}>
            <span style={{ fontSize: '0.55rem', letterSpacing: '0.22em', color: 'rgba(200,160,255,0.5)' }}>
              PERFECTION · CAPTAIN'S LOG
            </span>
          </div>
          {entries
            .filter(e => e.author !== 'SIGNAL')
            .map((entry, i) => (
              <FileCard key={entry.id} entry={entry} side="left" index={i} />
            ))}
          {entries.filter(e => e.author !== 'SIGNAL').length === 0 && (
            <p style={{ fontSize: '0.7rem', color: 'rgba(200,185,170,0.2)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
              NO LOGS RECOVERED.
            </p>
          )}
        </div>

        {/* Right — SIGNAL */}
        <div>
          <div style={{
            marginBottom: '16px', paddingBottom: '8px',
            borderBottom: '1px solid rgba(120,200,255,0.15)',
          }}>
            <span style={{ fontSize: '0.55rem', letterSpacing: '0.22em', color: 'rgba(120,200,255,0.5)' }}>
              SIGNAL · TRANSMISSION RECORD
            </span>
          </div>
          {entries.map((entry, i) => {
            if (entry.author === 'SIGNAL' || entry.author === 'SYSTEM') {
              return <FileCard key={entry.id} entry={entry} side="right" index={i} />
            }
            if (entry.signal_version) {
              const signalEntry = {
                ...entry,
                id: `sv-${entry.id}`,
                content: entry.signal_version,
                author: 'SIGNAL',
                entry_type: 'transmission',
                title: `${entry.title} — SIGNAL RECORD`,
              }
              return <FileCard key={`sv-${entry.id}`} entry={signalEntry} side="right" index={i} />
            }
            // Empty slot — eerie gap
            return (
              <div key={`empty-${entry.id}`} style={{
                marginBottom: '12px',
                padding: '14px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.03)',
                background: 'transparent',
                minHeight: '52px',
              }} />
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Main Storyline page ───────────────────────────────────
export default function Storyline() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeAct, setActiveAct] = useState(null)
  const scanlineRef = useRef(null)

  useEffect(() => {
    client.get('/storyline/')
      .then(res => {
        setData(res.data)
        if (res.data.acts?.length > 0) {
          setActiveAct(res.data.acts[0].act_number)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const allActs = data
    ? [
        ...data.acts.map(a => ({ ...a, locked: false })),
        ...data.locked_acts.map(a => ({ ...a, locked: true })),
      ].sort((a, b) => a.act_number - b.act_number)
    : []

  const currentAct = data?.acts?.find(a => a.act_number === activeAct)

  return (
    <div style={{
      minHeight: '100vh', color: 'white',
      background: 'linear-gradient(160deg, #08050e, #0e0818, #120a1a)',
      paddingBottom: '80px', position: 'relative', overflow: 'hidden',
    }}>

      {/* Scan line effect */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
      }} />

      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 1,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '28px 40px',
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '0.58rem', letterSpacing: '0.28em', color: 'rgba(200,185,170,0.35)', fontFamily: 'monospace' }}>
            PERFECTION UNIVERSE · MISSION ARCHIVE
          </p>
          <h1 style={{ margin: '0 0 8px', fontWeight: 300, fontSize: '1.6rem', letterSpacing: '0.2em', color: 'rgba(230,220,210,0.9)' }}>
            THE STORYLINE
          </h1>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(200,185,170,0.35)', letterSpacing: '0.08em', fontFamily: 'monospace' }}>
            RECOVERED DOCUMENTS · DUAL PERSPECTIVE ARCHIVE
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {user && (
            <span style={{ fontSize: '0.55rem', letterSpacing: '0.15em', color: 'rgba(200,185,170,0.3)', fontFamily: 'monospace' }}>
              MARS STAGE {data?.mars_stage ?? 0} · {data?.acts?.reduce((acc, a) => acc + (a.entries?.length || 0), 0) ?? 0} ENTRIES RECOVERED
            </span>
          )}
          <button onClick={() => { sound.click(); navigate('/') }}
            style={{ fontSize: '0.65rem', letterSpacing: '0.15em', padding: '8px 18px' }}>
            ← BACK
          </button>
        </div>
      </div>

      {/* Act tabs */}
      <div style={{
        position: 'relative', zIndex: 1,
        padding: '0 40px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', gap: '0', overflowX: 'auto',
      }}>
        {allActs.map(act => {
          const isActive = act.act_number === activeAct && !act.locked
          const isLocked = act.locked
          return (
            <motion.div
              key={act.act_number}
              whileHover={!isLocked ? { background: 'rgba(255,255,255,0.04)' } : {}}
              onClick={() => {
                if (isLocked) { sound.glyphWrong(); return }
                sound.click()
                setActiveAct(act.act_number)
              }}
              style={{
                padding: '16px 20px',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                borderBottom: isActive ? '2px solid rgba(200,185,170,0.5)' : '2px solid transparent',
                opacity: isLocked ? 0.4 : 1,
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <p style={{ margin: '0 0 2px', fontSize: '0.48rem', letterSpacing: '0.2em', color: 'rgba(200,185,170,0.4)', fontFamily: 'monospace' }}>
                ACT {act.act_number}{isLocked ? ` · 🔒 STAGE ${act.unlock_at_mars_stage}` : ''}
              </p>
              <p style={{
                margin: 0, fontSize: '0.7rem', letterSpacing: '0.12em',
                color: isActive ? 'rgba(230,220,210,0.95)' : 'rgba(200,185,170,0.55)',
                fontFamily: 'monospace',
              }}>
                {act.title}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '48px 40px' }}>

        {loading && (
          <motion.p
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ color: 'rgba(200,185,170,0.4)', letterSpacing: '0.15em', fontSize: '0.8rem', fontFamily: 'monospace' }}
          >
            LOADING ARCHIVE...
          </motion.p>
        )}

        {!loading && !data?.acts?.length && (
          <p style={{ color: 'rgba(200,185,170,0.3)', fontSize: '0.85rem', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
            NO ENTRIES RECOVERED. CHECK BACK LATER.
          </p>
        )}

        <AnimatePresence mode="wait">
          {currentAct && (
            <motion.div
              key={activeAct}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              {/* Act header */}
              <div style={{ marginBottom: '40px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '0.55rem', letterSpacing: '0.25em', color: 'rgba(200,185,170,0.35)', fontFamily: 'monospace' }}>
                  ACT {currentAct.act_number}
                </p>
                <h2 style={{ margin: '0 0 8px', fontWeight: 300, fontSize: '1.4rem', letterSpacing: '0.18em', color: 'rgba(230,220,210,0.9)' }}>
                  {currentAct.title}
                </h2>
                {currentAct.subtitle && (
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(200,185,170,0.4)', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
                    {currentAct.subtitle}
                  </p>
                )}
              </div>

              <ActPanel act={currentAct} marsStage={data?.mars_stage ?? 0} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}