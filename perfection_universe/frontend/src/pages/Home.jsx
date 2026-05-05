import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

export default function Home() {
  const [signalActive, setSignalActive] = useState(false)
  const [homeData, setHomeData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    client.get('/home/').then(res => setHomeData(res.data)).catch(() => {})
    const interval = setInterval(() => setSignalActive(prev => !prev), 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
        color: 'white',
        transition: 'background 0.7s ease',
        background: signalActive
          ? 'linear-gradient(135deg, #2a003f, #4b0082, #7a2cff)'
          : 'linear-gradient(135deg, #16001f, #2a003f, #3a005f)',
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at top, rgba(186,85,255,0.25), transparent 60%)',
      }} />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '40px 20px', position: 'relative',
      }}>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          style={{ fontSize: 'clamp(2.8rem, 9vw, 5.5rem)', fontWeight: 300, letterSpacing: '0.12em', margin: 0 }}
        >
          THE IN-BETWEEN
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1.2 }}
          style={{ marginTop: '1.5rem', maxWidth: '480px', color: 'rgba(200,160,255,0.85)', lineHeight: 1.8, fontSize: '1.05rem' }}
        >
          {homeData?.tagline || 'A space where memories drift, signals echo, and songs become places.'}
        </motion.p>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/console')}
          style={{ marginTop: '3rem' }}
        >
          ENTER THE DREAM
        </motion.button>
      </section>

      {/* ── ORBIT HUB ────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '48px',
        padding: '60px 20px', position: 'relative',
      }}>
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          style={{ fontSize: '2rem', fontWeight: 300, letterSpacing: '0.18em', margin: 0 }}
        >
          THE ORBIT
        </motion.h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px', width: '100%', maxWidth: '900px',
        }}>
          {[
            { title: 'COSMIC SCARS', desc: 'A liminal spacecraft drifting back to Mars', path: '/console' },
            { title: 'THE STORYLINE', desc: 'Fragments of memory and signal logs', path: null },
            { title: 'THE LIMINAL ROOMS', desc: 'Interactive dream environments', path: '/rooms' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.7 }}
              whileHover={{ y: -6, scale: 1.02 }}
              onClick={() => item.path && navigate(item.path)}
              style={{
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
                padding: '32px 28px',
                border: '1px solid rgba(255,255,255,0.15)',
                cursor: item.path ? 'pointer' : 'default',
                transition: 'background 0.2s ease',
              }}
            >
              <h3 style={{ margin: '0 0 12px', fontWeight: 400, letterSpacing: '0.1em', fontSize: '1.15rem' }}>
                {item.title}
              </h3>
              <p style={{ margin: 0, color: 'rgba(200,160,255,0.75)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── COSMIC SCARS SECTION ─────────────────────────── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '40px',
        padding: '60px 20px', position: 'relative',
        background: 'radial-gradient(circle at center, rgba(255,80,120,0.12), transparent 65%)',
      }}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 300, letterSpacing: '0.15em', margin: 0 }}
        >
          COSMIC SCARS
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
          style={{ maxWidth: '480px', textAlign: 'center', color: 'rgba(200,160,255,0.8)', lineHeight: 1.8 }}
        >
          A spacecraft drifts endlessly. Mars hangs in the distance — a planet, a person,
          a past self, an unreachable promise.
        </motion.p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/console')}
        >
          ACCESS SHIP CONSOLE
        </motion.button>

        {/* Mars */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
          style={{
            width: '160px', height: '160px', borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #ff7a5a, #6b1cff)',
            boxShadow: '0 0 60px rgba(255,80,120,0.3)',
          }}
        />
      </section>

      {/* ── FOOTER SIGNAL ────────────────────────────────── */}
      <footer style={{
        textAlign: 'center', padding: '24px 20px',
        fontSize: '0.75rem', letterSpacing: '0.15em',
        transition: 'color 0.5s ease',
        color: signalActive ? 'rgba(200,160,255,0.9)' : 'rgba(200,160,255,0.3)',
      }}>
        {signalActive
          ? 'THE SIGNAL IS ACTIVE · YOU ARE NOT ALONE HERE'
          : 'SIGNAL DORMANT · SEARCHING FOR CONNECTION'}
      </footer>
    </div>
  )
}