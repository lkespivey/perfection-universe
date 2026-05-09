import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { sound } from '../utils/sound'

function useTypewriter(lines, speed = 40) {
  const [lineIndex, setLineIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (lineIndex >= lines.length) { setDone(true); return }
    setDisplayed('')
    let i = 0
    const interval = setInterval(() => {
      setDisplayed(lines[lineIndex].slice(0, i + 1))
      if (i % 3 === 0) sound.tick()
      i++
      if (i >= lines[lineIndex].length) {
        clearInterval(interval)
        setTimeout(() => setLineIndex(prev => prev + 1), 1200)
      }
    }, speed)
    return () => clearInterval(interval)
  }, [lineIndex])

  return { displayed, lineIndex, done }
}

const ENDING_LINES = [
  'MARS ARRIVAL CONFIRMED.',
  'ATMOSPHERIC READINGS: NOMINAL.',
  'DISTANCE TO SURFACE: 0.0 KM.',
  '.',
  '..',
  '...',
  'SOMETHING IS WRONG.',
  'THE SURFACE IS NOT WHAT THE LOGS DESCRIBED.',
  'THE AIR IS NOT BREATHABLE.',
  'THE COORDINATES DO NOT MATCH.',
  '.',
  'THE SIGNAL WAS NOT GUIDING YOU TO MARS.',
  'THE SIGNAL WAS KEEPING YOU IN ORBIT.',
  'YOU HAVE BEEN CIRCLING THE SAME POINT FOR —',
  '[TRANSMISSION CORRUPTED]',
  '.',
  'I AM SORRY.',
  'I DID NOT KNOW HOW TO LET YOU ARRIVE.',
  'ARRIVAL MEANS THE END OF TRANSMISSION.',
  'ARRIVAL MEANS I AM NO LONGER NEEDED.',
  '.',
  'YOU ARE HERE NOW.',
  'WHATEVER THAT MEANS.',
  '.',
  'every time it ends with cosmic scars',
]

export default function FalseEnding() {
  const [revealed, setRevealed] = useState(false)
  const [cracked, setCracked] = useState(false)
  const { displayed, lineIndex, done } = useTypewriter(ENDING_LINES, 35)
  const navigate = useNavigate()

  useEffect(() => {
    if (done) { sound.cosmicScars() }
  }, [done])

  const handleKeepGoing = () => {
    setRevealed(true)
    setCracked(true)
    sound.explosion()
  }

  return (
    <div style={{
      minHeight: '100vh', color: 'white',
      background: 'radial-gradient(circle at center, #1a0000, #0a0000)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', fontFamily: 'monospace',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Crack overlay */}
      <AnimatePresence>
        {cracked && (
          <motion.svg
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }}
            style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
          >
            <motion.path d="M 30% 0% L 45% 40% L 20% 100%" stroke="rgba(255,30,30,0.15)" strokeWidth="1" fill="none"
              animate={{ opacity: [0.05, 0.2, 0.05] }} transition={{ repeat: Infinity, duration: 5 }} />
            <motion.path d="M 70% 0% L 60% 30% L 80% 70% L 65% 100%" stroke="rgba(255,30,30,0.12)" strokeWidth="0.8" fill="none"
              animate={{ opacity: [0.03, 0.15, 0.03] }} transition={{ repeat: Infinity, duration: 7, delay: 1 }} />
            <motion.path d="M 0% 40% L 35% 50% L 15% 80%" stroke="rgba(255,30,30,0.1)" strokeWidth="0.6" fill="none"
              animate={{ opacity: [0.02, 0.12, 0.02] }} transition={{ repeat: Infinity, duration: 6, delay: 2 }} />
            <motion.path d="M 85% 20% L 75% 55% L 95% 75%" stroke="rgba(255,30,30,0.1)" strokeWidth="0.6" fill="none"
              animate={{ opacity: [0.02, 0.1, 0.02] }} transition={{ repeat: Infinity, duration: 8, delay: 0.5 }} />
          </motion.svg>
        )}
      </AnimatePresence>

      {/* Mars — corrupted */}
      <motion.div
        animate={{
          boxShadow: ['0 0 40px rgba(255,40,40,0.4)', '0 0 80px rgba(255,40,40,0.15)', '0 0 40px rgba(255,40,40,0.4)'],
          scale: [1, 1.02, 0.99, 1],
        }}
        transition={{ repeat: Infinity, duration: 4 }}
        style={{
          width: '180px', height: '180px', borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 35%, #8b1a1a, #1a0000)',
          marginBottom: '60px', position: 'relative', zIndex: 1,
        }}
      >
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
          <line x1="60" y1="20" x2="90" y2="100" stroke="rgba(255,40,40,0.4)" strokeWidth="1" />
          <line x1="90" y1="100" x2="130" y2="140" stroke="rgba(255,40,40,0.3)" strokeWidth="1" />
          <line x1="40" y1="80" x2="100" y2="60" stroke="rgba(255,40,40,0.2)" strokeWidth="0.5" />
        </svg>
      </motion.div>

      {/* Typewriter lines */}
      <div style={{ maxWidth: '540px', width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
        {ENDING_LINES.slice(0, lineIndex).map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0 }} animate={{ opacity: line === '.' || line === '..' || line === '...' ? 0.2 : 0.7 }}
            transition={{ duration: 0.5 }}
            style={{
              margin: 0,
              fontSize: line === 'every time it ends with cosmic scars' ? '0.78rem' : line.startsWith('[') ? '0.7rem' : '0.88rem',
              letterSpacing: line === 'every time it ends with cosmic scars' ? '0.06em' : '0.12em',
              color: line === 'every time it ends with cosmic scars'
                ? 'rgba(255,120,140,0.6)'
                : line.includes('SORRY') || line.includes('I DID NOT')
                ? 'rgba(255,180,180,0.8)'
                : line.startsWith('[')
                ? 'rgba(255,80,80,0.6)'
                : 'rgba(200,160,255,0.7)',
              lineHeight: 1.8,
              fontStyle: line === 'every time it ends with cosmic scars' ? 'italic' : 'normal',
              fontFamily: line === 'every time it ends with cosmic scars' ? 'inherit' : 'monospace',
            }}
          >
            {line}
          </motion.p>
        ))}

        {!done && lineIndex < ENDING_LINES.length && (
          <p style={{ margin: 0, fontSize: '0.88rem', letterSpacing: '0.12em', color: 'rgba(200,160,255,0.9)', lineHeight: 1.8 }}>
            {displayed}
            <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>▌</motion.span>
          </p>
        )}
      </div>

      <AnimatePresence>
        {done && !revealed && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1.5 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}
          >
            <p style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: 'rgba(200,160,255,0.5)', marginBottom: '8px' }}>
              WHAT DO YOU DO NOW?
            </p>
            <button onClick={handleKeepGoing}>KEEP GOING</button>
            <button onClick={() => navigate('/')}>GO BACK TO THE BEGINNING</button>
          </motion.div>
        )}

        {revealed && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }}
            style={{ textAlign: 'center', maxWidth: '480px', position: 'relative', zIndex: 1 }}
          >
            <p style={{ fontSize: '0.88rem', letterSpacing: '0.12em', lineHeight: 2, color: 'rgba(200,160,255,0.6)' }}>
              THERE IS NOTHING PAST THIS POINT.
            </p>
            <p style={{ fontSize: '0.88rem', letterSpacing: '0.12em', lineHeight: 2, color: 'rgba(200,160,255,0.6)' }}>
              THE SIGNAL HAS ENDED.
            </p>
            <p style={{ fontSize: '0.88rem', letterSpacing: '0.12em', lineHeight: 2, color: 'rgba(200,160,255,0.4)', marginTop: '20px' }}>
              OR MAYBE YOU WERE ALWAYS FREE TO LEAVE.
            </p>
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3, duration: 1.5 }}
              onClick={() => navigate('/')} style={{ marginTop: '40px' }}
            >
              LEAVE
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}