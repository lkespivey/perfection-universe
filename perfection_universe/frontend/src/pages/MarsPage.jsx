import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { sound } from '../utils/sound'

const LYRICS = [
  'bored out of my mind, i cant find the time',
  'keeping all of these secrets so far away from me.',
  'taking it all in, oh its all dead,',
  'making this lock open without a key,',
  'what if its changing? what if its wasted?',
  '.',
  'all of its changing, all of its wasted',
  'every time i wanna go back to mars',
  'all of its changing, all of its wasted',
  'every time it ends with cosmic scars',
  '.',
  'i see my dreams floating in the milky way,',
  'counting the centuries day by day,',
  'and im trapped by choice, dont have a voice,',
  'i cant hear you over all this noise',
  '.',
  'all of its changing, all of its wasted',
  'every time i wanna go back to mars',
  'all of its changing, all of its wasted',
  'every time it ends with cosmic scars',
  '.',
  'and if it werent for you id still be on mars',
  'sitting in peace lonely watching the stars',
  'checking each day on broken radars',
  'now im left with nothing but cosmic scars',
  '.',
  'all of its changing, all of its wasted',
  'every time i wanna go back to mars',
  'all of its changing, all of its wasted',
  'every time it ends with cosmic scars',
]

export default function MarsPage() {
  const [visibleLines, setVisibleLines] = useState([])
  const [currentLine, setCurrentLine] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [charIdx, setCharIdx] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (currentLine >= LYRICS.length) { setDone(true); return }
    const line = LYRICS[currentLine]
    if (line === '.') {
      setTimeout(() => {
        setVisibleLines(prev => [...prev, ''])
        setCurrentLine(prev => prev + 1)
        setCurrentText('')
        setCharIdx(0)
      }, 800)
      return
    }
    if (charIdx < line.length) {
      const t = setTimeout(() => {
        setCurrentText(line.slice(0, charIdx + 1))
        setCharIdx(prev => prev + 1)
        if ((charIdx + 1) % 3 === 0) sound.tick()
      }, 38)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => {
        setVisibleLines(prev => [...prev, line])
        setCurrentLine(prev => prev + 1)
        setCurrentText('')
        setCharIdx(0)
      }, 600)
      return () => clearTimeout(t)
    }
  }, [currentLine, charIdx])

  return (
    <div style={{
      minHeight: '100vh', background: '#000005',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start',
      padding: '80px 20px', fontFamily: 'monospace',
    }}>
      {/* Mars orb */}
      <motion.div
        animate={{
          boxShadow: ['0 0 40px rgba(255,60,30,0.3)', '0 0 80px rgba(255,60,30,0.15)', '0 0 40px rgba(255,60,30,0.3)'],
        }}
        transition={{ repeat: Infinity, duration: 5 }}
        style={{
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #8b1a0a, #1a0000)',
          marginBottom: '60px', flexShrink: 0,
        }}
      />

      <div style={{ maxWidth: '480px', width: '100%' }}>
        {visibleLines.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: line === '' ? 0 : 0.6 }}
            transition={{ duration: 0.5 }}
            style={{
              margin: '0 0 10px', fontSize: '0.9rem',
              letterSpacing: '0.08em', lineHeight: 1.9,
              color: 'rgba(200,160,255,0.6)',
            }}
          >
            {line}
          </motion.p>
        ))}

        {!done && currentText && (
          <p style={{ margin: '0 0 10px', fontSize: '0.9rem', letterSpacing: '0.08em', lineHeight: 1.9, color: 'rgba(200,160,255,0.9)' }}>
            {currentText}
            <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>▌</motion.span>
          </p>
        )}

        {done && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 2 }}
            style={{ margin: '40px 0 0', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'rgba(200,160,255,0.25)' }}
          >
            cosmic scars
          </motion.p>
        )}
      </div>
    </div>
  )
}