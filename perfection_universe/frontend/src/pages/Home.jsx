import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'
import { sound } from '../utils/sound'

const DREAM_WORDS = ['DREAMS', 'MARS', 'NOISE', 'WASTED', 'CHANGING', 'SCARS', 'VOICE', 'CHOICE', 'TRAPPED', 'SIGNAL', 'TIME', 'SECRETS']

function DreamWord({ word, x, delay }) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: [0, 0.35, 0.35, 0], y: -180 }}
      transition={{ duration: 10, delay, repeat: Infinity, repeatDelay: 4 }}
      onHoverStart={() => { setHovered(true); sound.dreamFloat() }}
      onHoverEnd={() => setHovered(false)}
      style={{
        position: 'absolute',
        left: `${x}%`,
        bottom: '10%',
        fontSize: '0.65rem',
        letterSpacing: '0.2em',
        color: hovered ? 'rgba(200,160,255,0.9)' : 'rgba(200,160,255,0.18)',
        pointerEvents: 'auto',
        cursor: 'default',
        whiteSpace: 'nowrap',
        transition: 'color 0.3s ease',
        zIndex: 2,
      }}
    >
      {word}
    </motion.div>
  )
}

export default function Home() {
  const [signalActive, setSignalActive] = useState(false)
  const [homeData, setHomeData] = useState(null)
  const [marsGone, setMarsGone] = useState(false)
  const [sessionMinutes, setSessionMinutes] = useState(0)
  const [rareFooter, setRareFooter] = useState(false)
  const idleTimer = useRef(null)
  const sessionTimer = useRef(null)
  const humRef = useRef(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    client.get('/home/').then(res => setHomeData(res.data)).catch(() => {})

    // Signal pulse
    const iv = setInterval(() => setSignalActive(prev => !prev), 15000)

    // Rare footer — 1 in 50 chance
    if (Math.random() < 0.02) setRareFooter(true)

    // Session timer for navbar easter egg
    sessionTimer.current = setInterval(() => setSessionMinutes(prev => prev + 1), 60000)

    // Start ambient hum on first interaction
    const startHum = () => {
      if (!humRef.current) {
        humRef.current = sound.ambientHum()
      }
      window.removeEventListener('click', startHum)
    }
    window.addEventListener('click', startHum)

    return () => {
      clearInterval(iv)
      clearInterval(sessionTimer.current)
      clearTimeout(idleTimer.current)
      if (humRef.current) humRef.current.stop()
      window.removeEventListener('click', startHum)
    }
  }, [])

  useEffect(() => {
  let idleTimeout = null

  const resetIdle = () => {
    clearTimeout(idleTimeout)
    setMarsGone(false)
    idleTimeout = setTimeout(() => {
      setMarsGone(true)
    }, 5000)
  }

  // Only activate after user has been on page 5 seconds
  const startTimer = setTimeout(() => {
    window.addEventListener('mousemove', resetIdle)
    resetIdle()
  }, 30000)

  return () => {
    clearTimeout(startTimer)
    clearTimeout(idleTimeout)
    window.removeEventListener('mousemove', resetIdle)
  }
}, [])

  const [clockTime, setClockTime] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setClockTime(prev => prev + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  const formatClock = (s) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0')
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${h}:${m}:${sec}`
  }

  const dreams = DREAM_WORDS.map((w, i) => ({
    word: w,
    x: 5 + (i / DREAM_WORDS.length) * 88,
    delay: i * 3.5,
  }))

  return (
    <div style={{
      minHeight: '100vh', width: '100%', overflowX: 'hidden', color: 'white',
      transition: 'background 0.7s ease',
      background: signalActive
        ? 'linear-gradient(135deg, #2a003f, #4b0082, #7a2cff)'
        : 'linear-gradient(135deg, #16001f, #2a003f, #3a005f)',
    }}>

      {/* Ambient glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at top, rgba(186,85,255,0.25), transparent 60%)',
      }} />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '40px 20px',
        position: 'relative', overflow: 'hidden',
      }}>

        {/* Dream word floaters */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {dreams.map((d, i) => <DreamWord key={i} {...d} />)}
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          style={{ fontSize: 'clamp(2.8rem, 9vw, 5.5rem)', fontWeight: 300, letterSpacing: '0.12em', margin: 0, position: 'relative', zIndex: 3 }}
        >
          THE IN-BETWEEN
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1.2 }}
          style={{ marginTop: '1.5rem', maxWidth: '480px', color: 'rgba(200,160,255,0.85)', lineHeight: 1.8, fontSize: '1.05rem', position: 'relative', zIndex: 3 }}
        >
          {homeData?.tagline || 'A space where memories drift, signals echo, and songs become places.'}
        </motion.p>

        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { sound.click(); navigate('/console') }}
          style={{ marginTop: '3rem', position: 'relative', zIndex: 3 }}
        >
          ENTER THE DREAM
        </motion.button>

        {/* Hidden clock */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 8, duration: 3 }}
          title="counting the centuries day by day."
          style={{
            position: 'absolute', bottom: '24px', right: '24px',
            fontSize: '0.6rem', fontFamily: 'monospace',
            letterSpacing: '0.1em', color: 'rgba(200,160,255,0.15)',
            cursor: 'default', zIndex: 3,
          }}
        >
          {formatClock(clockTime)}
        </motion.div>
      </section>

      {/* ── ORBIT HUB ─────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '48px',
        padding: '60px 20px', position: 'relative',
      }}>
        <motion.h2
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 1 }}
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
            { title: 'THE STORYLINE', desc: 'Fragments of memory and signal logs', path: '/storyline' },
            { title: 'THE LIMINAL ROOMS', desc: 'Interactive dream environments', path: '/rooms' },
            { title: 'SIMULATIONS', desc: 'Games born from the signal. Survive them.', path: '/games' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.7 }}
              whileHover={{ y: -6, scale: 1.02 }}
              onClick={() => { if (item.path) { sound.click(); navigate(item.path) } }}
              onHoverStart={() => sound.hover()}
              style={{
                borderRadius: '16px', background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)', padding: '32px 28px',
                border: '1px solid rgba(255,255,255,0.15)',
                cursor: item.path ? 'pointer' : 'default',
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

      {/* ── COSMIC SCARS SECTION ──────────────────────────────── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '40px',
        padding: '60px 20px', position: 'relative',
        background: 'radial-gradient(circle at center, rgba(255,80,120,0.12), transparent 65%)',
      }}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 300, letterSpacing: '0.15em', margin: 0 }}
        >
          COSMIC SCARS
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
          style={{ maxWidth: '480px', textAlign: 'center', color: 'rgba(200,160,255,0.8)', lineHeight: 1.8 }}
        >
          A spacecraft drifts endlessly. Mars hangs in the distance — a planet, a person,
          a past self, an unreachable promise.
        </motion.p>

        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { sound.click(); navigate('/console') }}
        >
          ACCESS SHIP CONSOLE
        </motion.button>

        {/* Mars — drifts away when idle */}
        <AnimatePresence>
          {!marsGone ? (
            <motion.div
              key="mars"
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
              exit={{ y: -300, opacity: 0, transition: { duration: 4 } }}
              style={{
                width: '160px', height: '160px', borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #ff7a5a, #6b1cff)',
                boxShadow: '0 0 60px rgba(255,80,120,0.3)',
              }}
            />
          ) : (
            <motion.div
              key="mars-gone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: 'rgba(200,160,255,0.25)', fontFamily: 'monospace' }}>
                every time i wanna go back to mars
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer
        onClick={() => { if (signalActive) { sound.click(); navigate('/console') } }}
        style={{
          textAlign: 'center', padding: '24px 20px',
          fontSize: '0.7rem', letterSpacing: '0.18em',
          cursor: signalActive ? 'pointer' : 'default',
          transition: 'color 0.5s ease',
          color: signalActive ? 'rgba(200,160,255,0.9)' : 'rgba(200,160,255,0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <motion.div
            animate={{ opacity: signalActive ? [0.4, 1, 0.4] : 0.2 }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: signalActive ? 'rgba(100,255,180,0.9)' : 'rgba(255,255,255,0.3)',
            }}
          />
          {rareFooter
            ? "WHAT IF IT'S WASTED"
            : signalActive
            ? 'SIGNAL ACTIVE · CLICK TO TRANSMIT'
            : 'SIGNAL DORMANT · SEARCHING FOR CONNECTION'}
        </div>
      </footer>
    </div>
  )
}