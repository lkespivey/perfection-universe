import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

// ── Story transmissions ────────────────────────────────────
const STORY_ROUNDS = [
  { round: 1, transmission: 'THERE IS A SIGNAL BURIED IN THE STATIC. FIND IT. THE DIAL KNOWS WHERE TO LOOK.', tolerance: 4.5, timeLimit: 30 },
  { round: 2, transmission: 'CLOSER. THE SIGNAL IS CLOSER THAN YOU THINK. IT ALWAYS HAS BEEN.', tolerance: 3.5, timeLimit: 25 },
  { round: 3, transmission: 'THE SIGNAL IS MOVING. OR YOU ARE. IT IS HARD TO TELL THE DIFFERENCE.', tolerance: 2.8, timeLimit: 22 },
  { round: 4, transmission: 'YOU ARE TUNING INTO SOMETHING THAT DOES NOT WANT TO BE FOUND.', tolerance: 2.2, timeLimit: 20 },
  { round: 5, transmission: 'THIS IS THE LAST FREQUENCY. WHATEVER IS ON THE OTHER SIDE HAS BEEN WAITING.', tolerance: 1.6, timeLimit: 18 },
]

function useTypewriter(text, speed = 30) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    setDisplayed(''); setDone(false)
    if (!text) return
    let i = 0
    const iv = setInterval(() => {
      setDisplayed(text.slice(0, i + 1)); i++
      if (i >= text.length) { clearInterval(iv); setDone(true) }
    }, speed)
    return () => clearInterval(iv)
  }, [text])
  return { displayed, done }
}

function TransmissionScreen({ text, round, total, onContinue }) {
  const { displayed, done } = useTypewriter(text, 32)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(5,0,15,0.97)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '40px', zIndex: 20,
      }}>
      <p style={{ margin: '0 0 8px', fontSize: '0.6rem', letterSpacing: '0.25em', color: 'rgba(200,160,255,0.4)' }}>
        INCOMING TRANSMISSION · ROUND {round} OF {total}
      </p>
      <p style={{
        maxWidth: '440px', textAlign: 'center', fontSize: '0.92rem',
        letterSpacing: '0.1em', lineHeight: 2, color: 'rgba(200,160,255,0.85)',
        fontFamily: 'monospace', marginBottom: '40px', minHeight: '80px',
      }}>
        {displayed}
        {!done && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>▌</motion.span>}
      </p>
      {done && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={onContinue}
          style={{ fontSize: '0.72rem', letterSpacing: '0.2em', padding: '12px 28px' }}>
          TUNE IN →
        </motion.button>
      )}
    </motion.div>
  )
}

// ── Static noise canvas ────────────────────────────────────
function StaticNoise({ intensity }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    function draw() {
      const w = canvas.width; const h = canvas.height
      const imageData = ctx.createImageData(w, h)
      for (let i = 0; i < imageData.data.length; i += 4) {
        const v = Math.random() < intensity ? Math.floor(Math.random() * 80 + 20) : 0
        imageData.data[i] = v * 0.6
        imageData.data[i + 1] = v * 0.4
        imageData.data[i + 2] = v
        imageData.data[i + 3] = Math.floor(v * 1.8)
      }
      ctx.putImageData(imageData, 0, 0)
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animId)
  }, [intensity])
  return (
    <canvas ref={canvasRef} width={600} height={120}
      style={{ width: '100%', height: '120px', borderRadius: '8px', display: 'block' }} />
  )
}

export default function SignalAlignment() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [screen, setScreen] = useState('menu')
  const [mode, setMode] = useState(null)
  const [round, setRound] = useState(1)
  const [score, setScore] = useState(0)
  const [dialValue, setDialValue] = useState(50)
  const [target, setTarget] = useState(50)
  const [phase, setPhase] = useState('tuning') // tuning | found | wrong | transmission
  const [timeLeft, setTimeLeft] = useState(30)
  const [scoreSubmitted, setScoreSubmitted] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [personalBest, setPersonalBest] = useState(null)
  const [transmissionRound, setTransmissionRound] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [foundMessage, setFoundMessage] = useState('')
  const dialRef = useRef(null)
  const timerRef = useRef(null)

  const FOUND_MESSAGES = [
    '...SIGNAL ACQUIRED.',
    'THERE YOU ARE.',
    'FREQUENCY LOCKED.',
    '...I HEAR YOU.',
    'THE STATIC CLEARS.',
    'SIGNAL CONFIRMED.',
  ]

  const getConfig = useCallback((r, m) => {
    if (m === 'story') {
      return STORY_ROUNDS[Math.min(r - 1, STORY_ROUNDS.length - 1)]
    }
    return {
      tolerance: Math.max(1.2, 5 - r * 0.35),
      timeLimit: Math.max(12, 32 - r * 1.2),
    }
  }, [])

  const fetchLeaderboard = useCallback(async (m) => {
    try {
      const res = await client.get(`/games/leaderboard/?game=signal_alignment&mode=${m || mode}`)
      setLeaderboard(res.data.leaderboard)
      setPersonalBest(res.data.personal_best)
    } catch { }
  }, [mode])

  const submitScore = useCallback(async (finalScore, roundReached, m) => {
    if (!user || scoreSubmitted) return
    try {
      await client.post('/games/scores/submit/', {
        game: 'signal_alignment', mode: m || mode,
        score: finalScore, wave_reached: roundReached,
      })
      setScoreSubmitted(true)
      fetchLeaderboard(m || mode)
    } catch { }
  }, [user, mode, scoreSubmitted, fetchLeaderboard])

  // ── Proximity calculation ──────────────────────────────────
  const getProximity = useCallback((dial, tgt, tolerance) => {
    const dist = Math.abs(dial - tgt)
    if (dist <= tolerance) return 1
    if (dist <= tolerance * 4) return 1 - (dist - tolerance) / (tolerance * 3)
    return 0
  }, [])

  const startRound = useCallback((r, m) => {
    clearInterval(timerRef.current)
    const cfg = getConfig(r, m)
    const newTarget = Math.floor(Math.random() * 70) + 15
    setTarget(newTarget)
    setDialValue(50)
    setPhase('tuning')
    setTimeLeft(cfg.timeLimit)

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setPhase('wrong')
          setTimeout(() => {
            submitScore(score, r, m)
            setScreen('dead')
          }, 1500)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [getConfig, score, submitScore])

  const startGame = useCallback((m, r = 1) => {
    clearInterval(timerRef.current)
    setMode(m); setRound(r); setScore(0)
    setDialValue(50); setPhase('tuning')
    setScoreSubmitted(false); setScreen('playing')
    setTimeout(() => startRound(r, m), 300)
  }, [startRound])

  useEffect(() => () => clearInterval(timerRef.current), [])

  // ── Drag handling ──────────────────────────────────────────
  const handleDial = useCallback((clientX) => {
    if (!dialRef.current || phase !== 'tuning') return
    const rect = dialRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setDialValue(Math.round(pct))

    const cfg = getConfig(round, mode)
    if (Math.abs(pct - target) <= cfg.tolerance) {
      clearInterval(timerRef.current)
      setPhase('found')
      setFoundMessage(FOUND_MESSAGES[Math.floor(Math.random() * FOUND_MESSAGES.length)])
      const pts = Math.round(timeLeft * 10 * round)
      const newScore = score + pts
      setScore(newScore)

      setTimeout(() => {
        if (mode === 'story') {
          if (round >= STORY_ROUNDS.length) {
            submitScore(newScore, round, 'story')
            setScreen('victory')
          } else {
            setTransmissionRound(round)
            setPhase('transmission')
          }
        } else {
          const nextRound = round + 1
          setRound(nextRound)
          startRound(nextRound, mode)
        }
      }, 1600)
    }
  }, [phase, target, round, mode, timeLeft, score, getConfig, startRound, submitScore])

  const handleMouseMove = useCallback((e) => { if (isDragging) handleDial(e.clientX) }, [isDragging, handleDial])
  const handleTouchMove = useCallback((e) => { handleDial(e.touches[0].clientX) }, [handleDial])

  const proximity = getProximity(dialValue, target, getConfig(round, mode)?.tolerance || 3)
  const staticIntensity = Math.max(0.01, 0.35 * (1 - proximity))
  const signalStrength = proximity

  // ── Menu ──────────────────────────────────────────────────
  if (screen === 'menu') return (
    <div style={{
      minHeight: '100vh', color: 'white',
      background: 'linear-gradient(135deg, #05000f, #0a0020, #0f0030)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 20px', textAlign: 'center',
    }}>
      {/* Animated frequency bars */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '60px', marginBottom: '40px' }}>
        {Array.from({ length: 24 }, (_, i) => (
          <motion.div key={i}
            animate={{ height: [`${10 + Math.random() * 40}px`, `${10 + Math.random() * 50}px`, `${10 + Math.random() * 30}px`] }}
            transition={{ repeat: Infinity, duration: 0.6 + Math.random() * 0.8, delay: i * 0.05 }}
            style={{ width: '6px', borderRadius: '3px', background: `rgba(${120 + i * 4},${100 + i * 2},255,0.5)` }}
          />
        ))}
      </div>

      <p style={{ margin: '0 0 6px', fontSize: '0.6rem', letterSpacing: '0.28em', color: 'rgba(200,160,255,0.4)' }}>
        PERFECTION UNIVERSE · SIMULATION III
      </p>
      <h1 style={{ margin: '0 0 12px', fontWeight: 300, fontSize: '2.4rem', letterSpacing: '0.18em' }}>
        SIGNAL ALIGNMENT
      </h1>
      <p style={{ margin: '0 0 48px', fontSize: '0.85rem', color: 'rgba(200,160,255,0.5)', lineHeight: 1.8, maxWidth: '380px' }}>
        A signal is buried somewhere in the static. Drag the dial.
        Listen. Find it before the frequency collapses.
      </p>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '16px' }}>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => startGame('story')}
          style={{ fontSize: '0.75rem', letterSpacing: '0.2em', padding: '14px 32px' }}>
          STORY MODE
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => startGame('arcade')}
          style={{ fontSize: '0.75rem', letterSpacing: '0.2em', padding: '14px 32px' }}>
          ARCADE MODE
        </motion.button>
      </div>
      <button onClick={() => { fetchLeaderboard('arcade'); setScreen('leaderboard') }}
        style={{ fontSize: '0.65rem', letterSpacing: '0.15em', padding: '8px 18px', marginBottom: '16px' }}>
        VIEW LEADERBOARD
      </button>
      <button onClick={() => navigate('/games')}
        style={{ fontSize: '0.65rem', letterSpacing: '0.15em', padding: '8px 18px' }}>
        ← BACK TO SIMULATIONS
      </button>
    </div>
  )

  // ── Leaderboard ───────────────────────────────────────────
  if (screen === 'leaderboard') return (
    <div style={{
      minHeight: '100vh', color: 'white',
      background: 'linear-gradient(135deg, #05000f, #0a0020)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px',
    }}>
      <p style={{ margin: '0 0 4px', fontSize: '0.6rem', letterSpacing: '0.28em', color: 'rgba(200,160,255,0.4)' }}>SIGNAL ALIGNMENT</p>
      <h1 style={{ margin: '0 0 32px', fontWeight: 300, fontSize: '1.6rem', letterSpacing: '0.2em' }}>LEADERBOARD</h1>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
        {['arcade', 'story'].map(m => (
          <button key={m} onClick={() => fetchLeaderboard(m)}
            style={{ fontSize: '0.65rem', letterSpacing: '0.15em', padding: '8px 20px' }}>
            {m.toUpperCase()}
          </button>
        ))}
      </div>
      {personalBest && (
        <div style={{
          marginBottom: '20px', padding: '16px 28px', borderRadius: '12px',
          border: '1px solid rgba(200,160,255,0.2)', background: 'rgba(200,160,255,0.05)', textAlign: 'center',
        }}>
          <p style={{ margin: '0 0 4px', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'rgba(200,160,255,0.5)' }}>YOUR BEST</p>
          <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 200, color: 'rgba(200,160,255,0.9)' }}>{personalBest.score}</p>
        </div>
      )}
      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {leaderboard.length === 0 && (
          <p style={{ textAlign: 'center', color: 'rgba(200,160,255,0.4)', letterSpacing: '0.1em', fontSize: '0.85rem' }}>
            NO SCORES YET. BE THE FIRST.
          </p>
        )}
        {leaderboard.map((entry, i) => (
          <motion.div key={entry.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 20px', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.07)',
              background: i === 0 ? 'rgba(255,200,80,0.06)' : 'rgba(255,255,255,0.03)',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '0.65rem', color: i === 0 ? 'rgba(255,200,80,0.8)' : 'rgba(200,160,255,0.3)', width: '20px' }}>{i + 1}</span>
              <span style={{ fontSize: '0.88rem', letterSpacing: '0.08em' }}>{entry.username}</span>
            </div>
            <span style={{ fontSize: '1rem', fontWeight: 200, color: 'rgba(200,160,255,0.8)' }}>{entry.score}</span>
          </motion.div>
        ))}
      </div>
      <button onClick={() => setScreen('menu')} style={{ marginTop: '40px', fontSize: '0.65rem', letterSpacing: '0.15em', padding: '10px 24px' }}>← BACK</button>
    </div>
  )

  // ── Playing ───────────────────────────────────────────────
  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
      style={{
        minHeight: '100vh', color: 'white',
        background: 'linear-gradient(135deg, #05000f, #0a0020, #0f0030)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '20px', userSelect: 'none',
      }}
    >
      <AnimatePresence>
        {phase === 'transmission' && (
          <TransmissionScreen
            text={STORY_ROUNDS[transmissionRound]?.transmission || ''}
            round={transmissionRound}
            total={STORY_ROUNDS.length}
            onContinue={() => {
              const nextRound = transmissionRound + 1
              setRound(nextRound)
              startRound(nextRound, 'story')
            }}
          />
        )}
      </AnimatePresence>

      <div style={{ width: '100%', maxWidth: '580px' }}>

        {/* HUD */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'rgba(200,160,255,0.4)' }}>SCORE</p>
            <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 200 }}>{score}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 2px', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'rgba(200,160,255,0.4)' }}>
              {mode === 'story' ? `ROUND ${round} / ${STORY_ROUNDS.length}` : `ROUND ${round}`}
            </p>
            <p style={{ margin: 0, fontSize: '0.75rem', letterSpacing: '0.15em', color:
              phase === 'found' ? 'rgba(100,255,180,0.9)' :
              phase === 'wrong' ? 'rgba(255,100,140,0.9)' :
              'rgba(200,160,255,0.6)'
            }}>
              {phase === 'found' ? foundMessage : phase === 'wrong' ? 'SIGNAL COLLAPSED' : 'FIND THE SIGNAL'}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0 0 2px', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'rgba(200,160,255,0.4)' }}>TIME</p>
            <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 200, color: timeLeft <= 5 ? 'rgba(255,100,140,0.9)' : 'white' }}>
              {timeLeft}s
            </p>
          </div>
        </div>

        {/* Signal strength display */}
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 12px', fontSize: '0.6rem', letterSpacing: '0.22em', color: 'rgba(200,160,255,0.4)' }}>
            SIGNAL STRENGTH
          </p>
          {/* Frequency bars visualizer */}
          <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', justifyContent: 'center', height: '64px', marginBottom: '8px' }}>
            {Array.from({ length: 32 }, (_, i) => {
              const center = 16
              const dist = Math.abs(i - center)
              const baseH = Math.max(4, 40 * signalStrength * Math.exp(-dist * 0.25))
              return (
                <motion.div key={i}
                  animate={{ height: `${baseH + (Math.random() * 4 * (1 - signalStrength))}px` }}
                  transition={{ duration: 0.08 }}
                  style={{
                    width: '5px', borderRadius: '3px',
                    background: signalStrength > 0.7
                      ? `rgba(100,255,180,${0.4 + signalStrength * 0.5})`
                      : signalStrength > 0.3
                      ? `rgba(200,160,255,${0.3 + signalStrength * 0.4})`
                      : `rgba(120,80,200,${0.2 + signalStrength * 0.3})`,
                  }}
                />
              )
            })}
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${signalStrength * 100}%` }}
              style={{
                height: '100%', borderRadius: '3px',
                background: signalStrength > 0.7 ? 'rgba(100,255,180,0.8)' :
                  signalStrength > 0.3 ? 'rgba(200,160,255,0.6)' : 'rgba(120,80,200,0.4)',
              }}
            />
          </div>
        </div>

        {/* Static noise */}
        <div style={{ marginBottom: '28px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
          <StaticNoise intensity={staticIntensity} />
        </div>

        {/* Dial */}
        <div style={{ marginBottom: '12px' }}>
          <p style={{ margin: '0 0 16px', fontSize: '0.6rem', letterSpacing: '0.22em', color: 'rgba(200,160,255,0.4)', textAlign: 'center' }}>
            DRAG TO TUNE
          </p>
          <div
            ref={dialRef}
            onMouseDown={(e) => { setIsDragging(true); handleDial(e.clientX) }}
            onTouchStart={(e) => handleDial(e.touches[0].clientX)}
            onTouchMove={handleTouchMove}
            style={{
              position: 'relative', height: '56px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '28px',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'ew-resize', overflow: 'hidden',
            }}
          >
            {/* Track lines */}
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} style={{
                position: 'absolute', left: `${(i / 19) * 100}%`, top: '30%', bottom: '30%',
                width: '1px', background: 'rgba(255,255,255,0.08)',
              }} />
            ))}

            {/* Dial handle */}
            <motion.div
              animate={{ left: `${dialValue}%` }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                position: 'absolute', top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '44px', height: '44px',
                borderRadius: '50%',
                background: signalStrength > 0.7
                  ? 'radial-gradient(circle, rgba(100,255,180,0.9), rgba(60,200,140,0.6))'
                  : 'radial-gradient(circle, rgba(200,160,255,0.8), rgba(140,100,220,0.5))',
                boxShadow: signalStrength > 0.7
                  ? '0 0 20px rgba(100,255,180,0.6)'
                  : `0 0 ${8 + signalStrength * 16}px rgba(200,160,255,${0.3 + signalStrength * 0.4})`,
                border: '2px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', color: 'white', fontWeight: 500,
              }}
            >
              ◈
            </motion.div>
          </div>

          {/* Dial value display */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', padding: '0 4px' }}>
            <span style={{ fontSize: '0.6rem', color: 'rgba(200,160,255,0.3)', letterSpacing: '0.1em' }}>0</span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(200,160,255,0.5)', letterSpacing: '0.12em', fontFamily: 'monospace' }}>
              {dialValue.toString().padStart(3, '0')} MHz
            </span>
            <span style={{ fontSize: '0.6rem', color: 'rgba(200,160,255,0.3)', letterSpacing: '0.1em' }}>100</span>
          </div>
        </div>
      </div>

      {/* Dead overlay */}
      <AnimatePresence>
        {screen === 'dead' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(5,0,15,0.95)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', zIndex: 20,
            }}>
            <p style={{ margin: '0 0 6px', fontSize: '0.6rem', letterSpacing: '0.28em', color: 'rgba(255,80,100,0.6)' }}>FREQUENCY LOST</p>
            <h2 style={{ margin: '0 0 8px', fontWeight: 300, fontSize: '1.6rem', letterSpacing: '0.15em' }}>SIGNAL COLLAPSED</h2>
            <p style={{ margin: '0 0 4px', fontSize: '0.75rem', letterSpacing: '0.12em', color: 'rgba(200,160,255,0.5)' }}>FINAL SCORE</p>
            <p style={{ margin: '0 0 32px', fontSize: '2.4rem', fontWeight: 200 }}>{score}</p>
            {!user && <p style={{ margin: '0 0 20px', fontSize: '0.72rem', color: 'rgba(200,160,255,0.4)' }}>SIGN IN TO SAVE YOUR SCORE</p>}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={() => startGame(mode)} style={{ fontSize: '0.7rem', letterSpacing: '0.15em', padding: '10px 24px' }}>TRY AGAIN</button>
              <button onClick={() => { fetchLeaderboard(mode); setScreen('leaderboard') }} style={{ fontSize: '0.7rem', letterSpacing: '0.15em', padding: '10px 24px' }}>LEADERBOARD</button>
              <button onClick={() => setScreen('menu')} style={{ fontSize: '0.7rem', letterSpacing: '0.15em', padding: '10px 24px' }}>MENU</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Victory overlay */}
      <AnimatePresence>
        {screen === 'victory' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(5,0,15,0.95)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', zIndex: 20, padding: '20px', textAlign: 'center',
            }}>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '60px', marginBottom: '28px' }}>
              {Array.from({ length: 20 }, (_, i) => (
                <motion.div key={i}
                  animate={{ height: [`${20 + i * 2}px`, `${40 + i}px`, `${20 + i * 2}px`] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.06 }}
                  style={{ width: '6px', borderRadius: '3px', background: 'rgba(100,255,180,0.7)' }}
                />
              ))}
            </div>
            <p style={{ margin: '0 0 6px', fontSize: '0.6rem', letterSpacing: '0.28em', color: 'rgba(100,255,180,0.6)' }}>ALL SIGNALS FOUND</p>
            <h2 style={{ margin: '0 0 8px', fontWeight: 300, fontSize: '1.6rem', letterSpacing: '0.15em' }}>ALIGNMENT COMPLETE.</h2>
            <p style={{ margin: '0 0 4px', fontSize: '0.75rem', letterSpacing: '0.12em', color: 'rgba(200,160,255,0.5)' }}>FINAL SCORE</p>
            <p style={{ margin: '0 0 8px', fontSize: '2.4rem', fontWeight: 200 }}>{score}</p>
            <p style={{ margin: '0 0 32px', fontSize: '0.78rem', color: 'rgba(200,160,255,0.4)', maxWidth: '320px', lineHeight: 1.7 }}>
              Every frequency found. Whatever was on the other side has received your transmission. Whether it responds is another matter.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={() => startGame('story')} style={{ fontSize: '0.7rem', letterSpacing: '0.15em', padding: '10px 24px' }}>PLAY AGAIN</button>
              <button onClick={() => { fetchLeaderboard('story'); setScreen('leaderboard') }} style={{ fontSize: '0.7rem', letterSpacing: '0.15em', padding: '10px 24px' }}>LEADERBOARD</button>
              <button onClick={() => navigate('/console')} style={{ fontSize: '0.7rem', letterSpacing: '0.15em', padding: '10px 24px' }}>RETURN TO CONSOLE</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}