import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

const TYPE_COLORS = {
  transmission: 'rgba(120,200,255,0.85)',
  memory: 'rgba(200,160,255,0.85)',
  system: 'rgba(100,255,180,0.85)',
  anomaly: 'rgba(255,120,140,0.85)',
}

const TYPE_BORDERS = {
  transmission: 'rgba(120,200,255,0.25)',
  memory: 'rgba(200,160,255,0.25)',
  system: 'rgba(100,255,180,0.25)',
  anomaly: 'rgba(255,120,140,0.25)',
}

export default function Console() {
  const [signals, setSignals] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    client.get('/console/signals/')
      .then(res => { setSignals(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{
      minHeight: '100vh', color: 'white',
      background: 'linear-gradient(135deg, #0a0015, #1a0030, #2a003f)',
      padding: '0 0 60px',
    }}>

      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '28px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '0.65rem', letterSpacing: '0.25em', color: 'rgba(200,160,255,0.5)' }}>
            PERFECTION UNIVERSE · VESSEL I
          </p>
          <h1 style={{ margin: 0, fontWeight: 300, fontSize: '1.4rem', letterSpacing: '0.2em' }}>
            COSMIC SCARS — SHIP CONSOLE
          </h1>
        </div>
        <button
          onClick={() => navigate('/')}
          style={{ fontSize: '0.7rem', letterSpacing: '0.15em', padding: '8px 18px' }}
        >
          ← BACK
        </button>
      </div>

      {/* Status bar */}
      <div style={{
        display: 'flex', gap: '32px', padding: '16px 40px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        fontSize: '0.65rem', letterSpacing: '0.15em',
        color: 'rgba(200,160,255,0.45)', flexWrap: 'wrap',
      }}>
        <span>DESTINATION: MARS</span>
        <span>SIGNAL: {signals.length > 0 ? 'RECEIVING' : 'SCANNING'}</span>
        <span>LOGS: {signals.length}</span>
      </div>

      {/* Main layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selected ? '1fr 1fr' : '1fr',
        gap: '0',
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '40px 20px',
        transition: 'grid-template-columns 0.3s ease',
      }}>

        {/* Signal list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading && (
            <motion.p
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ color: 'rgba(200,160,255,0.5)', letterSpacing: '0.15em', fontSize: '0.8rem' }}
            >
              SCANNING FOR TRANSMISSIONS...
            </motion.p>
          )}

          {!loading && signals.length === 0 && (
            <p style={{ color: 'rgba(200,160,255,0.4)', fontSize: '0.85rem', letterSpacing: '0.1em' }}>
              NO TRANSMISSIONS RECEIVED.
            </p>
          )}

          {signals.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ x: 4 }}
              onClick={() => setSelected(selected?.id === s.id ? null : s)}
              style={{
                padding: '20px 24px',
                borderRadius: '12px',
                border: `1px solid ${selected?.id === s.id ? TYPE_BORDERS[s.signal_type] : 'rgba(255,255,255,0.08)'}`,
                background: selected?.id === s.id
                  ? 'rgba(255,255,255,0.07)'
                  : 'rgba(255,255,255,0.04)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div>
                  <p style={{
                    margin: '0 0 6px',
                    fontSize: '0.6rem', letterSpacing: '0.2em',
                    color: TYPE_COLORS[s.signal_type] || 'rgba(200,160,255,0.6)',
                  }}>
                    [{s.signal_type.toUpperCase()}]{s.stardate ? ` · ${s.stardate}` : ''}
                  </p>
                  <h3 style={{ margin: 0, fontWeight: 400, fontSize: '1rem', letterSpacing: '0.05em' }}>
                    {s.title}
                  </h3>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', flexShrink: 0 }}>
                  {selected?.id === s.id ? '▼' : '▶'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              style={{
                padding: '28px 32px',
                marginLeft: '20px',
                borderRadius: '16px',
                border: `1px solid ${TYPE_BORDERS[selected.signal_type]}`,
                background: 'rgba(255,255,255,0.04)',
                alignSelf: 'flex-start',
                position: 'sticky',
                top: '20px',
              }}
            >
              <p style={{
                margin: '0 0 8px', fontSize: '0.6rem', letterSpacing: '0.25em',
                color: TYPE_COLORS[selected.signal_type],
              }}>
                [{selected.signal_type.toUpperCase()}]{selected.stardate ? ` · ${selected.stardate}` : ''}
              </p>
              <h2 style={{ margin: '0 0 20px', fontWeight: 300, fontSize: '1.4rem', letterSpacing: '0.08em' }}>
                {selected.title}
              </h2>
              <p style={{
                margin: 0, lineHeight: 1.9, fontSize: '0.95rem',
                color: 'rgba(220,200,255,0.85)',
                whiteSpace: 'pre-wrap',
              }}>
                {selected.content}
              </p>
              <button
                onClick={() => setSelected(null)}
                style={{ marginTop: '28px', fontSize: '0.7rem', letterSpacing: '0.15em', padding: '8px 18px' }}
              >
                CLOSE
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}