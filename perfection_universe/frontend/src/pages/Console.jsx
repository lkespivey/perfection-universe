import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import client from '../api/client'

export default function Console() {
  const [signals, setSignals] = useState([])

  useEffect(() => {
    client.get('/console/signals/').then(res => setSignals(res.data))
  }, [])

  return (
    <div style={{ minHeight: '100vh', padding: '60px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ fontSize: '2rem', fontWeight: 300, letterSpacing: '0.2em', marginBottom: '40px' }}
      >
        SHIP CONSOLE — COSMIC SCARS
      </motion.h1>

      {signals.length === 0 && (
        <p style={{ color: 'rgba(200,160,255,0.6)' }}>No transmissions received.</p>
      )}

      {signals.map((s, i) => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="card"
          style={{ maxWidth: '100%', marginBottom: '16px' }}
        >
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: 'rgba(200,160,255,0.6)', marginBottom: '6px' }}>
            [{s.signal_type.toUpperCase()}] {s.stardate}
          </p>
          <h3 style={{ margin: '0 0 8px', fontWeight: 400 }}>{s.title}</h3>
          <p style={{ margin: 0, color: 'rgba(220,200,255,0.8)', lineHeight: 1.7, fontSize: '0.9rem' }}>{s.content}</p>
        </motion.div>
      ))}
    </div>
  )
}