import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

// ── Story transmissions between waves ─────────────────────
const STORY_WAVES = [
  {
    wave: 1,
    transmission: 'STARDATE 001. THE DEBRIS FIELD BEGINS. MARS IS VISIBLE ON LONG-RANGE. KEEP MOVING.',
    asteroidSpeed: 2.5,
    spawnRate: 1400,
    duration: 30,
  },
  {
    wave: 2,
    transmission: 'THE FIELD IS THICKER NOW. THE SIGNAL SAYS THIS IS NORMAL. THE SIGNAL HAS SAID THAT BEFORE.',
    asteroidSpeed: 3.5,
    spawnRate: 1100,
    duration: 30,
  },
  {
    wave: 3,
    transmission: 'PROXIMITY TO MARS: CLOSE. THE DEBRIS IS NOT NATURAL. SOMETHING MADE THIS FIELD.',
    asteroidSpeed: 4.5,
    spawnRate: 850,
    duration: 30,
  },
  {
    wave: 4,
    transmission: 'THE SIGNAL IS QUIET. THAT IS WORSE THAN ANYTHING IT COULD SAY.',
    asteroidSpeed: 5.5,
    spawnRate: 650,
    duration: 30,
  },
  {
    wave: 5,
    transmission: 'MARS. FINALLY. OR WHATEVER THIS IS.',
    asteroidSpeed: 7,
    spawnRate: 500,
    duration: 30,
  },
]

const CANVAS_W = 800
const CANVAS_H = 400
const SHIP_W = 48
const SHIP_H = 28
const SHIP_X = 80

function useTypewriter(text, speed = 30) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    setDisplayed('')
    setDone(false)
    if (!text) return
    let i = 0
    const iv = setInterval(() => {
      setDisplayed(text.slice(0, i + 1))
      i++
      if (i >= text.length) { clearInterval(iv); setDone(true) }
    }, speed)
    return () => clearInterval(iv)
  }, [text])
  return { displayed, done }
}

// ── Transmission screen shown between waves ────────────────
function TransmissionScreen({ text, wave, totalWaves, onContinue }) {
  const { displayed, done } = useTypewriter(text, 32)
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(5,0,15,0.97)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px', zIndex: 10,
      borderRadius: '16px',
    }}>
      <p style={{ margin: '0 0 8px', fontSize: '0.6rem', letterSpacing: '0.25em', color: 'rgba(200,160,255,0.4)' }}>
        INCOMING TRANSMISSION · WAVE {wave} OF {totalWaves} COMPLETE
      </p>
      <p style={{
        maxWidth: '480px', textAlign: 'center',
        fontSize: '0.95rem', letterSpacing: '0.1em',
        lineHeight: 2, color: 'rgba(200,160,255,0.85)',
        fontFamily: 'monospace', marginBottom: '40px',
        minHeight: '80px',
      }}>
        {displayed}
        {!done && (
          <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>▌</motion.span>
        )}
      </p>
      {done && (
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={onContinue}
          style={{ fontSize: '0.72rem', letterSpacing: '0.2em', padding: '12px 28px' }}
        >
          CONTINUE →
        </motion.button>
      )}
    </div>
  )
}

// ── Main game component ────────────────────────────────────
export default function AsteroidDrift() {
  const canvasRef = useRef(null)
  const gameRef = useRef({
    ship: { y: CANVAS_H / 2 },
    asteroids: [],
    stars: [],
    keys: {},
    score: 0,
    alive: true,
    animId: null,
    lastSpawn: 0,
    waveTimer: 0,
    waveStart: 0,
  })
  const navigate = useNavigate()
  const { user } = useAuth()

  const [screen, setScreen] = useState('menu') // menu | modeSelect | transmission | playing | dead | victory | leaderboard
  const [mode, setMode] = useState(null) // 'arcade' | 'story'
  const [score, setScore] = useState(0)
  const [wave, setWave] = useState(1)
  const [leaderboard, setLeaderboard] = useState([])
  const [personalBest, setPersonalBest] = useState(null)
  const [transmissionWave, setTransmissionWave] = useState(0)
  const [scoreSubmitted, setScoreSubmitted] = useState(false)

  // ── Generate stars once ──────────────────────────────────
  useEffect(() => {
    gameRef.current.stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      r: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.4 + 0.1,
      opacity: Math.random() * 0.6 + 0.2,
    }))
  }, [])

  const fetchLeaderboard = useCallback(async (m) => {
    try {
      const res = await client.get(`/games/leaderboard/?game=asteroid_drift&mode=${m || mode}`)
      setLeaderboard(res.data.leaderboard)
      setPersonalBest(res.data.personal_best)
    } catch { }
  }, [mode])

  const submitScore = useCallback(async (finalScore, waveReached, m) => {
    if (!user || scoreSubmitted) return
    try {
      await client.post('/games/scores/submit/', {
        game: 'asteroid_drift',
        mode: m || mode,
        score: finalScore,
        wave_reached: waveReached,
      })
      setScoreSubmitted(true)
      fetchLeaderboard(m || mode)
    } catch { }
  }, [user, mode, scoreSubmitted, fetchLeaderboard])

  // ── Key handling ─────────────────────────────────────────
  useEffect(() => {
    const down = (e) => { gameRef.current.keys[e.key] = true }
    const up = (e) => { gameRef.current.keys[e.key] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // ── Game loop ─────────────────────────────────────────────
  const startGame = useCallback((selectedMode, startWave = 1) => {
    const g = gameRef.current
    g.ship.y = CANVAS_H / 2
    g.asteroids = []
    g.score = 0
    g.alive = true
    g.lastSpawn = 0
    g.waveStart = performance.now()
    cancelAnimationFrame(g.animId)
    setScore(0)
    setWave(startWave)
    setScoreSubmitted(false)
    setScreen('playing')

    const currentMode = selectedMode || mode
    const currentWaveIndex = startWave - 1
    const waveConfig = currentMode === 'story'
      ? STORY_WAVES[Math.min(currentWaveIndex, STORY_WAVES.length - 1)]
      : { asteroidSpeed: 3 + (startWave - 1) * 0.8, spawnRate: 1200 - (startWave - 1) * 80, duration: Infinity }

    function spawnAsteroid() {
      const size = Math.random() * 22 + 12
      g.asteroids.push({
        x: CANVAS_W + size,
        y: Math.random() * (CANVAS_H - size * 2) + size,
        r: size,
        speed: waveConfig.asteroidSpeed * (0.7 + Math.random() * 0.6),
        rot: 0,
        rotSpeed: (Math.random() - 0.5) * 0.06,
        points: Math.floor(Math.random() * 5) + 3,
      })
    }

    function drawShip(ctx, x, y) {
      ctx.save()
      ctx.translate(x, y)
      // Engine glow
      ctx.shadowColor = 'rgba(100,200,255,0.8)'
      ctx.shadowBlur = 12
      // Body
      ctx.fillStyle = 'rgba(180,220,255,0.9)'
      ctx.beginPath()
      ctx.moveTo(SHIP_W / 2, 0)
      ctx.lineTo(-SHIP_W / 2, -SHIP_H / 2)
      ctx.lineTo(-SHIP_W / 3, 0)
      ctx.lineTo(-SHIP_W / 2, SHIP_H / 2)
      ctx.closePath()
      ctx.fill()
      // Cockpit
      ctx.fillStyle = 'rgba(120,180,255,0.9)'
      ctx.beginPath()
      ctx.ellipse(SHIP_W / 6, 0, SHIP_W / 5, SHIP_H / 4, 0, 0, Math.PI * 2)
      ctx.fill()
      // Engine flame
      ctx.shadowColor = 'rgba(255,140,60,0.9)'
      ctx.fillStyle = 'rgba(255,140,60,0.8)'
      ctx.beginPath()
      ctx.moveTo(-SHIP_W / 3, -6)
      ctx.lineTo(-SHIP_W / 2 - 10 - Math.random() * 8, 0)
      ctx.lineTo(-SHIP_W / 3, 6)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    function drawAsteroid(ctx, a) {
      ctx.save()
      ctx.translate(a.x, a.y)
      ctx.rotate(a.rot)
      ctx.shadowColor = 'rgba(180,120,80,0.4)'
      ctx.shadowBlur = 8
      ctx.fillStyle = 'rgba(140,100,70,0.85)'
      ctx.strokeStyle = 'rgba(200,160,120,0.6)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let i = 0; i < a.points; i++) {
        const angle = (i / a.points) * Math.PI * 2
        const jitter = a.r * (0.75 + Math.random() * 0.25)
        const px = Math.cos(angle) * jitter
        const py = Math.sin(angle) * jitter
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }

    function loop(now) {
      if (!g.alive) return
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')

      // ── Background ──────────────────────────────────────
      ctx.fillStyle = '#05000f'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      // ── Stars ───────────────────────────────────────────
      g.stars.forEach(s => {
        s.x -= s.speed
        if (s.x < 0) { s.x = CANVAS_W; s.y = Math.random() * CANVAS_H }
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,180,255,${s.opacity})`
        ctx.fill()
      })

      // ── Mars in background ──────────────────────────────
      const marsX = CANVAS_W - 80
      const marsY = 80
      const marsR = currentMode === 'story' ? 20 + startWave * 8 : 30
      const marsGrad = ctx.createRadialGradient(marsX - marsR * 0.3, marsY - marsR * 0.3, 2, marsX, marsY, marsR)
      marsGrad.addColorStop(0, 'rgba(255,120,80,0.6)')
      marsGrad.addColorStop(1, 'rgba(180,40,20,0.2)')
      ctx.beginPath()
      ctx.arc(marsX, marsY, marsR, 0, Math.PI * 2)
      ctx.fillStyle = marsGrad
      ctx.fill()

      // ── Ship movement ───────────────────────────────────
      const speed = 4
      const keys = g.keys
      if ((keys['ArrowUp'] || keys['w'] || keys['W']) && g.ship.y > SHIP_H)
        g.ship.y -= speed
      if ((keys['ArrowDown'] || keys['s'] || keys['S']) && g.ship.y < CANVAS_H - SHIP_H)
        g.ship.y += speed

      // ── Spawn asteroids ─────────────────────────────────
      if (!g.lastSpawn || now - g.lastSpawn > waveConfig.spawnRate) {
        spawnAsteroid()
        g.lastSpawn = now
      }

      // ── Move & draw asteroids ───────────────────────────
      g.asteroids = g.asteroids.filter(a => {
        a.x -= a.speed
        a.rot += a.rotSpeed
        if (a.x < -a.r * 2) return false
        drawAsteroid(ctx, a)

        // ── Collision ─────────────────────────────────────
        const dx = a.x - SHIP_X
        const dy = a.y - g.ship.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < a.r + SHIP_H * 0.38) {
          g.alive = false
          cancelAnimationFrame(g.animId)
          const finalScore = Math.round(g.score)
          const currentWave = startWave
          submitScore(finalScore, currentWave, currentMode)
          setScore(finalScore)
          setWave(currentWave)
          setScreen('dead')
          return false
        }
        return true
      })

      // ── Draw ship ───────────────────────────────────────
      drawShip(ctx, SHIP_X, g.ship.y)

      // ── Score ───────────────────────────────────────────
      g.score += 0.05
      const displayScore = Math.round(g.score)
      setScore(displayScore)

      // ── HUD ─────────────────────────────────────────────
      ctx.fillStyle = 'rgba(200,160,255,0.5)'
      ctx.font = '11px monospace'
      ctx.letterSpacing = '2px'
      ctx.fillText(`SCORE: ${displayScore}`, 16, 24)
      if (currentMode === 'story') {
        ctx.fillText(`WAVE ${startWave} / ${STORY_WAVES.length}`, 16, 42)
        // Wave timer bar
        const elapsed = (now - g.waveStart) / 1000
        const progress = Math.min(elapsed / waveConfig.duration, 1)
        ctx.fillStyle = 'rgba(255,255,255,0.08)'
        ctx.fillRect(CANVAS_W - 120, 12, 100, 6)
        ctx.fillStyle = 'rgba(120,200,255,0.6)'
        ctx.fillRect(CANVAS_W - 120, 12, 100 * (1 - progress), 6)

        // Wave complete
        if (elapsed >= waveConfig.duration) {
          g.alive = false
          cancelAnimationFrame(g.animId)
          const finalScore = Math.round(g.score)
          setScore(finalScore)
          if (startWave >= STORY_WAVES.length) {
            submitScore(finalScore, startWave, currentMode)
            setScreen('victory')
          } else {
            setTransmissionWave(startWave)
            setScreen('transmission')
          }
          return
        }
      } else {
        // Arcade: wave label every 30s
        const elapsed = (now - g.waveStart) / 1000
        const arcadeWave = Math.floor(elapsed / 30) + 1
        if (arcadeWave !== startWave) {
          setWave(arcadeWave)
        }
        ctx.fillText(`WAVE ${arcadeWave}`, 16, 42)
      }

      g.animId = requestAnimationFrame(loop)
    }

    g.animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(g.animId)
  }, [mode, submitScore])

  // ── Cleanup on unmount ────────────────────────────────────
  useEffect(() => {
    return () => cancelAnimationFrame(gameRef.current.animId)
  }, [])

  // ── Screens ───────────────────────────────────────────────

  if (screen === 'menu') return (
    <div style={{
      minHeight: '100vh', color: 'white',
      background: 'linear-gradient(135deg, #05000f, #0a0020, #0f0030)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', textAlign: 'center',
    }}>
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 6 }}
        style={{
          width: '80px', height: '80px', borderRadius: '50%', marginBottom: '40px',
          background: 'radial-gradient(circle at 35% 35%, #ff7a5a, #3a0010)',
          boxShadow: '0 0 40px rgba(255,80,40,0.3)',
        }}
      />
      <p style={{ margin: '0 0 6px', fontSize: '0.6rem', letterSpacing: '0.28em', color: 'rgba(200,160,255,0.4)' }}>
        PERFECTION UNIVERSE · SIMULATION I
      </p>
      <h1 style={{ margin: '0 0 12px', fontWeight: 300, fontSize: '2.4rem', letterSpacing: '0.18em' }}>
        ASTEROID DRIFT
      </h1>
      <p style={{ margin: '0 0 48px', fontSize: '0.85rem', color: 'rgba(200,160,255,0.5)', lineHeight: 1.8, maxWidth: '360px' }}>
        The vessel approaches Mars through a debris field that should not exist.
        Navigate. Survive. Do not ask the signal why.
      </p>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '24px' }}>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setMode('story'); setWave(1); startGame('story', 1) }}
          style={{ fontSize: '0.75rem', letterSpacing: '0.2em', padding: '14px 32px' }}>
          STORY MODE
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setMode('arcade'); setWave(1); startGame('arcade', 1) }}
          style={{ fontSize: '0.75rem', letterSpacing: '0.2em', padding: '14px 32px' }}>
          ARCADE MODE
        </motion.button>
      </div>
      <button onClick={() => { fetchLeaderboard('arcade'); setScreen('leaderboard') }}
        style={{ fontSize: '0.65rem', letterSpacing: '0.15em', padding: '8px 18px', marginBottom: '24px' }}>
        VIEW LEADERBOARD
      </button>
      <p style={{ fontSize: '0.72rem', color: 'rgba(200,160,255,0.35)', letterSpacing: '0.1em' }}>
        CONTROLS: ↑ ↓ · W S
      </p>
      <button onClick={() => navigate('/games')}
        style={{ marginTop: '24px', fontSize: '0.65rem', letterSpacing: '0.15em', padding: '8px 18px' }}>
        ← BACK TO SIMULATIONS
      </button>
    </div>
  )

  if (screen === 'leaderboard') return (
    <div style={{
      minHeight: '100vh', color: 'white',
      background: 'linear-gradient(135deg, #05000f, #0a0020)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '60px 20px',
    }}>
      <p style={{ margin: '0 0 4px', fontSize: '0.6rem', letterSpacing: '0.28em', color: 'rgba(200,160,255,0.4)' }}>
        ASTEROID DRIFT
      </p>
      <h1 style={{ margin: '0 0 40px', fontWeight: 300, fontSize: '1.6rem', letterSpacing: '0.2em' }}>
        LEADERBOARD
      </h1>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        {['arcade', 'story'].map(m => (
          <button key={m} onClick={() => fetchLeaderboard(m)}
            style={{ fontSize: '0.65rem', letterSpacing: '0.15em', padding: '8px 20px' }}>
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {personalBest && (
        <div style={{
          marginBottom: '24px', padding: '16px 28px',
          borderRadius: '12px', border: '1px solid rgba(200,160,255,0.2)',
          background: 'rgba(200,160,255,0.05)', textAlign: 'center',
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
          <motion.div key={entry.id}
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 20px', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.07)',
              background: i === 0 ? 'rgba(255,200,80,0.06)' : 'rgba(255,255,255,0.03)',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '0.65rem', color: i === 0 ? 'rgba(255,200,80,0.8)' : 'rgba(200,160,255,0.3)', letterSpacing: '0.1em', width: '20px' }}>
                {i + 1}
              </span>
              <span style={{ fontSize: '0.88rem', letterSpacing: '0.08em' }}>{entry.username}</span>
            </div>
            <span style={{ fontSize: '1rem', fontWeight: 200, color: 'rgba(200,160,255,0.8)' }}>{entry.score}</span>
          </motion.div>
        ))}
      </div>

      <button onClick={() => setScreen('menu')}
        style={{ marginTop: '40px', fontSize: '0.65rem', letterSpacing: '0.15em', padding: '10px 24px' }}>
        ← BACK
      </button>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', color: 'white',
      background: '#05000f',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      {/* Canvas wrapper */}
      <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: 'block', maxWidth: '100%' }}
        />

        {/* Transmission overlay */}
        <AnimatePresence>
          {screen === 'transmission' && (
            <TransmissionScreen
              text={STORY_WAVES[transmissionWave]?.transmission || ''}
              wave={transmissionWave}
              totalWaves={STORY_WAVES.length}
              onContinue={() => {
                const nextWave = transmissionWave + 1
                setWave(nextWave)
                startGame('story', nextWave)
              }}
            />
          )}
        </AnimatePresence>

        {/* Dead screen */}
        <AnimatePresence>
          {screen === 'dead' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                position: 'absolute', inset: 0,
                background: 'rgba(5,0,15,0.92)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                borderRadius: '16px',
              }}>
              <p style={{ margin: '0 0 6px', fontSize: '0.6rem', letterSpacing: '0.28em', color: 'rgba(255,80,100,0.6)' }}>
                VESSEL DESTROYED
              </p>
              <h2 style={{ margin: '0 0 8px', fontWeight: 300, fontSize: '1.6rem', letterSpacing: '0.15em' }}>
                SIGNAL LOST
              </h2>
              <p style={{ margin: '0 0 4px', fontSize: '0.75rem', letterSpacing: '0.12em', color: 'rgba(200,160,255,0.5)' }}>
                FINAL SCORE
              </p>
              <p style={{ margin: '0 0 32px', fontSize: '2.4rem', fontWeight: 200, color: 'rgba(200,160,255,0.9)' }}>
                {score}
              </p>
              {!user && (
                <p style={{ margin: '0 0 20px', fontSize: '0.72rem', color: 'rgba(200,160,255,0.4)', letterSpacing: '0.08em' }}>
                  SIGN IN TO SAVE YOUR SCORE
                </p>
              )}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={() => { setMode(mode); startGame(mode, 1) }}
                  style={{ fontSize: '0.7rem', letterSpacing: '0.15em', padding: '10px 24px' }}>
                  TRY AGAIN
                </button>
                <button onClick={() => { fetchLeaderboard(mode); setScreen('leaderboard') }}
                  style={{ fontSize: '0.7rem', letterSpacing: '0.15em', padding: '10px 24px' }}>
                  LEADERBOARD
                </button>
                <button onClick={() => setScreen('menu')}
                  style={{ fontSize: '0.7rem', letterSpacing: '0.15em', padding: '10px 24px' }}>
                  MENU
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Victory screen */}
        <AnimatePresence>
          {screen === 'victory' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                position: 'absolute', inset: 0,
                background: 'rgba(5,0,15,0.94)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                borderRadius: '16px',
              }}>
              <motion.div
                animate={{ boxShadow: ['0 0 30px rgba(255,80,40,0.4)', '0 0 60px rgba(255,80,40,0.2)', '0 0 30px rgba(255,80,40,0.4)'] }}
                transition={{ repeat: Infinity, duration: 3 }}
                style={{
                  width: '60px', height: '60px', borderRadius: '50%', marginBottom: '28px',
                  background: 'radial-gradient(circle at 35% 35%, #ff7a5a, #3a0010)',
                }}
              />
              <p style={{ margin: '0 0 6px', fontSize: '0.6rem', letterSpacing: '0.28em', color: 'rgba(255,120,80,0.7)' }}>
                MARS REACHED
              </p>
              <h2 style={{ margin: '0 0 8px', fontWeight: 300, fontSize: '1.6rem', letterSpacing: '0.15em' }}>
                YOU ARRIVED.
              </h2>
              <p style={{ margin: '0 0 4px', fontSize: '0.75rem', letterSpacing: '0.12em', color: 'rgba(200,160,255,0.5)' }}>
                FINAL SCORE
              </p>
              <p style={{ margin: '0 0 8px', fontSize: '2.4rem', fontWeight: 200, color: 'rgba(200,160,255,0.9)' }}>
                {score}
              </p>
              <p style={{ margin: '0 0 32px', fontSize: '0.78rem', color: 'rgba(200,160,255,0.4)', letterSpacing: '0.08em', maxWidth: '300px', textAlign: 'center', lineHeight: 1.7 }}>
                The signal was quiet when you landed. That may mean nothing. Or everything.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={() => { startGame('story', 1) }}
                  style={{ fontSize: '0.7rem', letterSpacing: '0.15em', padding: '10px 24px' }}>
                  PLAY AGAIN
                </button>
                <button onClick={() => { fetchLeaderboard('story'); setScreen('leaderboard') }}
                  style={{ fontSize: '0.7rem', letterSpacing: '0.15em', padding: '10px 24px' }}>
                  LEADERBOARD
                </button>
                <button onClick={() => navigate('/console')}
                  style={{ fontSize: '0.7rem', letterSpacing: '0.15em', padding: '10px 24px' }}>
                  RETURN TO CONSOLE
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {screen === 'playing' && (
        <p style={{ marginTop: '16px', fontSize: '0.65rem', letterSpacing: '0.15em', color: 'rgba(200,160,255,0.3)' }}>
          ↑ ↓ · W S TO MOVE
        </p>
      )}
    </div>
  )
}