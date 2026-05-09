import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

// ── Glyphs & colors ────────────────────────────────────────
const GLYPHS = ['◈', '◇', '△', '○', '⬡', '✦']
const GLYPH_COLORS = [
  'rgba(120,200,255,0.95)',
  'rgba(200,160,255,0.95)',
  'rgba(100,255,180,0.95)',
  'rgba(255,180,80,0.95)',
  'rgba(255,100,140,0.95)',
  'rgba(180,255,120,0.95)',
]
const GLYPH_GLOW = [
  'rgba(120,200,255,0.6)',
  'rgba(200,160,255,0.6)',
  'rgba(100,255,180,0.6)',
  'rgba(255,180,80,0.6)',
  'rgba(255,100,140,0.6)',
  'rgba(180,255,120,0.6)',
]

// ── Story transmissions ────────────────────────────────────
const STORY_ROUNDS = [
  { round: 1, transmission: 'THE SIGNAL IS TESTING YOUR MEMORY. WATCH. REPEAT. DO NOT GUESS.', seqLen: 3, speed: 900 },
  { round: 2, transmission: 'IT REMEMBERS EVERYTHING YOU HAVE EVER TRANSMITTED. CAN YOU SAY THE SAME?', seqLen: 4, speed: 820 },
  { round: 3, transmission: 'THE PATTERNS ARE NOT RANDOM. THEY ARE TRYING TO TELL YOU SOMETHING.', seqLen: 5, speed: 740 },
  { round: 4, transmission: 'YOU ARE BEING CALIBRATED. FOR WHAT, THE SIGNAL WILL NOT SAY.', seqLen: 6, speed: 660 },
  { round: 5, transmission: 'ALMOST. THE SIGNAL IS ALMOST SATISFIED.', seqLen: 7, speed: 580 },
  { round: 6, transmission: 'THE ECHO IS COMPLETE. YOU HAVE MATCHED THE VOID.', seqLen: 8, speed: 500 },
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
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(5,0,15,0.97)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px', zIndex: 10, borderRadius: '20px',
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
          BEGIN ECHO →
        </motion.button>
      )}
    </div>
  )
}

export default function EchoMatch() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [screen, setScreen] = useState('menu')
  const [mode, setMode] = useState(null)
  const [round, setRound] = useState(1)
  const [sequence, setSequence] = useState([])
  const [playerSeq, setPlayerSeq] = useState([])
  const [phase, setPhase] = useState('watching') // watching | inputting | correct | wrong | transmission
  const [activeGlyph, setActiveGlyph] = useState(null)
  const [activePulse, setActivePulse] = useState(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [scoreSubmitted, setScoreSubmitted] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [personalBest, setPersonalBest] = useState(null)
  const [transmissionRound, setTransmissionRound] = useState(0)
  const timeoutRef = useRef([])

  const clearTimeouts = () => { timeoutRef.current.forEach(clearTimeout); timeoutRef.current = [] }

  const fetchLeaderboard = useCallback(async (m) => {
    try {
      const res = await client.get(`/games/leaderboard/?game=echo_match&mode=${m || mode}`)
      setLeaderboard(res.data.leaderboard)
      setPersonalBest(res.data.personal_best)
    } catch { }
  }, [mode])

  const submitScore = useCallback(async (finalScore, roundReached, m) => {
    if (!user || scoreSubmitted) return
    try {
      await client.post('/games/scores/submit/', {
        game: 'echo_match', mode: m || mode,
        score: finalScore, wave_reached: roundReached,
      })
      setScoreSubmitted(true)
      fetchLeaderboard(m || mode)
    } catch { }
  }, [user, mode, scoreSubmitted, fetchLeaderboard])

  // ── Build & play a sequence ────────────────────────────────
  const playSequence = useCallback((seq, speed) => {
    setPhase('watching')
    setPlayerSeq([])
    clearTimeouts()
    seq.forEach((idx, i) => {
      const t1 = setTimeout(() => setActiveGlyph(idx), i * speed)
      const t2 = setTimeout(() => setActiveGlyph(null), i * speed + speed * 0.55)
      timeoutRef.current.push(t1, t2)
    })
    const t3 = setTimeout(() => { setPhase('inputting') }, seq.length * speed + 200)
    timeoutRef.current.push(t3)
  }, [])

  const startRound = useCallback((r, m, existingSeq) => {
    clearTimeouts()
    setPlayerSeq([])
    setPhase('watching')
    const currentMode = m || mode
    let speed, seqLen

    if (currentMode === 'story') {
      const cfg = STORY_ROUNDS[Math.min(r - 1, STORY_ROUNDS.length - 1)]
      speed = cfg.speed; seqLen = cfg.seqLen
    } else {
      speed = Math.max(300, 950 - r * 55)
      seqLen = 3 + Math.floor(r * 0.8)
    }

    let newSeq
    if (existingSeq) {
      newSeq = [...existingSeq, Math.floor(Math.random() * GLYPHS.length)]
    } else {
      newSeq = Array.from({ length: seqLen }, () => Math.floor(Math.random() * GLYPHS.length))
    }
    setSequence(newSeq)
    setTimeout(() => playSequence(newSeq, speed), 600)
  }, [mode, playSequence])

  // ── Handle player input ───────────────────────────────────
  const handleGlyphClick = useCallback((idx) => {
    if (phase !== 'inputting') return
    setActivePulse(idx)
    setTimeout(() => setActivePulse(null), 200)

    const newPlayerSeq = [...playerSeq, idx]
    setPlayerSeq(newPlayerSeq)

    const pos = newPlayerSeq.length - 1
    if (newPlayerSeq[pos] !== sequence[pos]) {
      // Wrong
      setPhase('wrong')
      clearTimeouts()
      const newLives = lives - 1
      setLives(newLives)
      if (newLives <= 0) {
        setTimeout(() => {
          submitScore(score, round, mode)
          setScreen('dead')
        }, 1200)
      } else {
        setTimeout(() => {
          const currentMode = mode
          const speed = currentMode === 'story'
            ? STORY_ROUNDS[Math.min(round - 1, STORY_ROUNDS.length - 1)].speed
            : Math.max(300, 950 - round * 55)
          playSequence(sequence, speed)
        }, 1200)
      }
      return
    }

    if (newPlayerSeq.length === sequence.length) {
      // Correct
      setPhase('correct')
      const pts = sequence.length * 10 * round
      const newScore = score + pts
      setScore(newScore)
      clearTimeouts()

      if (mode === 'story') {
        if (round >= STORY_ROUNDS.length) {
          setTimeout(() => {
            submitScore(newScore, round, 'story')
            setScreen('victory')
          }, 1000)
        } else {
          setTimeout(() => {
            setTransmissionRound(round)
            setPhase('transmission')
          }, 1000)
        }
      } else {
        // Arcade — keep growing sequence
        setTimeout(() => {
          const nextRound = round + 1
          setRound(nextRound)
          startRound(nextRound, mode, sequence)
        }, 1000)
      }
    }
  }, [phase, playerSeq, sequence, lives, score, round, mode, playSequence, startRound, submitScore])

  const startGame = useCallback((m, r = 1) => {
    clearTimeouts()
    setMode(m); setRound(r); setScore(0); setLives(3)
    setSequence([]); setPlayerSeq([]); setScoreSubmitted(false)
    setActiveGlyph(null); setActivePulse(null)
    setScreen('playing')
    setTimeout(() => startRound(r, m, null), 400)
  }, [startRound])

  useEffect(() => () => clearTimeouts(), [])

  // ── Menu ──────────────────────────────────────────────────
  if (screen === 'menu') return (
    <div style={{
      minHeight: '100vh', color: 'white',
      background: 'linear-gradient(135deg, #05000f, #0a0020, #0f0030)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 20px', textAlign: 'center',
    }}>
      {/* Animated glyphs preview */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
        {GLYPHS.map((g, i) => (
          <motion.span key={i}
            animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.9, 1.1, 0.9] }}
            transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.3 }}
            style={{ fontSize: '1.8rem', color: GLYPH_COLORS[i] }}>
            {g}
          </motion.span>
        ))}
      </div>

      <p style={{ margin: '0 0 6px', fontSize: '0.6rem', letterSpacing: '0.28em', color: 'rgba(200,160,255,0.4)' }}>
        PERFECTION UNIVERSE · SIMULATION II
      </p>
      <h1 style={{ margin: '0 0 12px', fontWeight: 300, fontSize: '2.4rem', letterSpacing: '0.18em' }}>
        ECHO MATCH
      </h1>
      <p style={{ margin: '0 0 48px', fontSize: '0.85rem', color: 'rgba(200,160,255,0.5)', lineHeight: 1.8, maxWidth: '380px' }}>
        The signal flashes patterns from the void. Watch. Then repeat them back exactly.
        The signal remembers everything. Do you?
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
      <p style={{ margin: '0 0 4px', fontSize: '0.6rem', letterSpacing: '0.28em', color: 'rgba(200,160,255,0.4)' }}>ECHO MATCH</p>
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
    <div style={{
      minHeight: '100vh', color: 'white',
      background: 'linear-gradient(135deg, #05000f, #0a0020, #0f0030)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '20px',
    }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: '560px' }}>

        {/* Transmission overlay */}
        <AnimatePresence>
          {phase === 'transmission' && (
            <TransmissionScreen
              text={STORY_ROUNDS[transmissionRound]?.transmission || ''}
              round={transmissionRound}
              total={STORY_ROUNDS.length}
              onContinue={() => {
                const nextRound = transmissionRound + 1
                setRound(nextRound)
                setPhase('watching')
                startRound(nextRound, 'story', null)
              }}
            />
          )}
        </AnimatePresence>

        {/* HUD */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'rgba(200,160,255,0.4)' }}>SCORE</p>
            <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 200 }}>{score}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'rgba(200,160,255,0.4)' }}>
              {mode === 'story' ? `ROUND ${round} / ${STORY_ROUNDS.length}` : `ROUND ${round}`}
            </p>
            <p style={{ margin: 0, fontSize: '0.75rem', letterSpacing: '0.15em', color:
              phase === 'watching' ? 'rgba(120,200,255,0.8)' :
              phase === 'inputting' ? 'rgba(100,255,180,0.8)' :
              phase === 'correct' ? 'rgba(100,255,180,0.9)' :
              phase === 'wrong' ? 'rgba(255,100,140,0.9)' : 'rgba(200,160,255,0.6)'
            }}>
              {phase === 'watching' ? 'WATCH THE SIGNAL' :
               phase === 'inputting' ? 'REPEAT THE ECHO' :
               phase === 'correct' ? '✦ CORRECT' :
               phase === 'wrong' ? '✕ WRONG' : ''}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0 0 2px', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'rgba(200,160,255,0.4)' }}>LIVES</p>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
              {[0, 1, 2].map(i => (
                <motion.span key={i} animate={{ opacity: i < lives ? 1 : 0.15 }}
                  style={{ fontSize: '1rem', color: 'rgba(255,100,140,0.9)' }}>◈</motion.span>
              ))}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '32px', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
          <motion.div
            animate={{ width: `${(playerSeq.length / Math.max(sequence.length, 1)) * 100}%` }}
            style={{ height: '100%', background: 'rgba(100,255,180,0.6)', borderRadius: '2px' }}
          />
        </div>

        {/* Glyph grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {GLYPHS.map((glyph, i) => {
            const isActive = activeGlyph === i
            const isPulse = activePulse === i
            return (
              <motion.button
                key={i}
                onClick={() => handleGlyphClick(i)}
                animate={{
                  scale: isActive || isPulse ? 1.12 : 1,
                  boxShadow: isActive
                    ? `0 0 40px ${GLYPH_GLOW[i]}, 0 0 80px ${GLYPH_GLOW[i]}`
                    : isPulse
                    ? `0 0 24px ${GLYPH_GLOW[i]}`
                    : '0 0 0 transparent',
                }}
                transition={{ duration: 0.15 }}
                style={{
                  aspectRatio: '1',
                  borderRadius: '16px',
                  border: `1px solid ${isActive || isPulse ? GLYPH_COLORS[i] : 'rgba(255,255,255,0.1)'}`,
                  background: isActive
                    ? `rgba(${GLYPH_COLORS[i].match(/\d+/g).slice(0,3).join(',')},0.18)`
                    : isPulse
                    ? `rgba(${GLYPH_COLORS[i].match(/\d+/g).slice(0,3).join(',')},0.12)`
                    : 'rgba(255,255,255,0.04)',
                  cursor: phase === 'inputting' ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem',
                  color: isActive || isPulse ? GLYPH_COLORS[i] : 'rgba(255,255,255,0.3)',
                  transition: 'color 0.1s, border-color 0.1s, background 0.1s',
                  padding: 0,
                }}
              >
                {glyph}
              </motion.button>
            )
          })}
        </div>

        {/* Sequence dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {sequence.map((gi, i) => (
            <motion.div key={i}
              animate={{ opacity: i < playerSeq.length ? 1 : 0.2, scale: i < playerSeq.length ? 1.1 : 1 }}
              style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: i < playerSeq.length ? GLYPH_COLORS[playerSeq[i]] : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
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
            <p style={{ margin: '0 0 6px', fontSize: '0.6rem', letterSpacing: '0.28em', color: 'rgba(255,80,100,0.6)' }}>ECHO FAILED</p>
            <h2 style={{ margin: '0 0 8px', fontWeight: 300, fontSize: '1.6rem', letterSpacing: '0.15em' }}>SIGNAL LOST</h2>
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
              justifyContent: 'center', zIndex: 20,
            }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
              {GLYPHS.map((g, i) => (
                <motion.span key={i} animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.15, 0.9] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                  style={{ fontSize: '1.6rem', color: GLYPH_COLORS[i] }}>{g}</motion.span>
              ))}
            </div>
            <p style={{ margin: '0 0 6px', fontSize: '0.6rem', letterSpacing: '0.28em', color: 'rgba(100,255,180,0.6)' }}>ECHO COMPLETE</p>
            <h2 style={{ margin: '0 0 8px', fontWeight: 300, fontSize: '1.6rem', letterSpacing: '0.15em' }}>THE VOID REMEMBERS YOU.</h2>
            <p style={{ margin: '0 0 4px', fontSize: '0.75rem', letterSpacing: '0.12em', color: 'rgba(200,160,255,0.5)' }}>FINAL SCORE</p>
            <p style={{ margin: '0 0 8px', fontSize: '2.4rem', fontWeight: 200 }}>{score}</p>
            <p style={{ margin: '0 0 32px', fontSize: '0.78rem', color: 'rgba(200,160,255,0.4)', maxWidth: '300px', textAlign: 'center', lineHeight: 1.7 }}>
              You matched every pattern. The signal has calibrated you for something. It won't say what.
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