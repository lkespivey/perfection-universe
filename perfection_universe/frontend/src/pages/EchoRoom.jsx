import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { sound } from '../utils/sound'

// ── Room sound engine ─────────────────────────────────────
function useRoomSounds() {
  const ctx = useRef(null)
  const hum = useRef(null)
  const echoTimeout = useRef(null)

  const getCtx = () => {
    if (!ctx.current) ctx.current = new (window.AudioContext || window.webkitAudioContext)()
    return ctx.current
  }

  const startAmbient = useCallback(() => {
    if (hum.current) return
    try {
      const c = getCtx()
      const o1 = c.createOscillator()
      const o2 = c.createOscillator()
      const g = c.createGain()
      o1.type = 'sine'; o1.frequency.value = 58
      o2.type = 'sine'; o2.frequency.value = 61
      g.gain.value = 0
      o1.connect(g); o2.connect(g); g.connect(c.destination)
      o1.start(); o2.start()
      g.gain.linearRampToValueAtTime(0.055, c.currentTime + 2.5)
      hum.current = { o1, o2, g }

      const scheduleEcho = () => {
        echoTimeout.current = setTimeout(() => {
          try {
            const ec = getCtx()
            const eo = ec.createOscillator()
            const eg = ec.createGain()
            eo.type = 'sine'
            eo.frequency.value = 300 + Math.random() * 600
            eg.gain.value = 0.03
            eg.gain.exponentialRampToValueAtTime(0.0001, ec.currentTime + 2.5)
            eo.connect(eg); eg.connect(ec.destination)
            eo.start(); eo.stop(ec.currentTime + 3)
          } catch(e) {}
          scheduleEcho()
        }, 7000 + Math.random() * 18000)
      }
      scheduleEcho()
    } catch(e) {}
  }, [])

  const stopAmbient = useCallback(() => {
    clearTimeout(echoTimeout.current)
    if (!hum.current) return
    try {
      const c = getCtx()
      hum.current.g.gain.linearRampToValueAtTime(0, c.currentTime + 1.2)
      setTimeout(() => {
        try { hum.current?.o1.stop(); hum.current?.o2.stop() } catch(e) {}
        hum.current = null
      }, 1500)
    } catch(e) {}
  }, [])

  const playStep = useCallback(() => {
    try {
      const c = getCtx(); const t = c.currentTime
      const o = c.createOscillator()
      const g = c.createGain()
      o.type = 'sine'; o.frequency.value = 75
      o.frequency.exponentialRampToValueAtTime(38, t + 0.12)
      g.gain.value = 0.18
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28)
      o.connect(g); g.connect(c.destination)
      o.start(t); o.stop(t + 0.32)
      // Delayed echo
      setTimeout(() => {
        try {
          const c2 = getCtx(); const t2 = c2.currentTime
          const o2 = c2.createOscillator(); const g2 = c2.createGain()
          o2.type = 'sine'; o2.frequency.value = 68
          g2.gain.value = 0.045
          g2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.5)
          o2.connect(g2); g2.connect(c2.destination)
          o2.start(t2); o2.stop(t2 + 0.6)
        } catch(e) {}
      }, 550 + Math.random() * 200)
    } catch(e) {}
  }, [])

  const playFlickerSound = useCallback(() => {
    try {
      const c = getCtx(); const t = c.currentTime
      const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.06), c.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.25
      const src = c.createBufferSource(); const g = c.createGain()
      src.buffer = buf; g.gain.value = 0.07
      src.connect(g); g.connect(c.destination); src.start()
    } catch(e) {}
  }, [])

  useEffect(() => () => stopAmbient(), [stopAmbient])

  return { startAmbient, stopAmbient, playStep, playFlickerSound }
}

// ── Directions ────────────────────────────────────────────
// 0=North 1=East 2=South 3=West
const DIR_NAMES = ['NORTH', 'EAST', 'SOUTH', 'WEST']
const TOTAL_DIRECTIONS = 4
const MAX_DEPTH = 7

// What you see looking in each direction at a given position
// Position is {x, y} on a grid
function getForwardPos(pos, dir) {
  if (dir === 0) return { x: pos.x, y: pos.y - 1 }
  if (dir === 1) return { x: pos.x + 1, y: pos.y }
  if (dir === 2) return { x: pos.x, y: pos.y + 1 }
  return { x: pos.x - 1, y: pos.y }
}

// Depth from origin
function getDepth(pos) {
  return Math.abs(pos.x) + Math.abs(pos.y)
}

// Lore at certain depths
const LORE = {
  1: 'the walls remember everyone who has walked here.',
  3: 'you can hear something at the end. or you think you can.',
  5: 'the lights have been flickering for a long time. no one has changed them.',
  7: 'you are not the first. the echo proves it.',
}

// ── Canvas hallway renderer ───────────────────────────────
function drawHallway(canvas, depthSteps, flickering) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height

  ctx.fillStyle = '#0c0b08'
  ctx.fillRect(0, 0, W, H)

  const vpX = W / 2
  const vpY = H * 0.44
  const SEGS = 10

  // Draw from far to near
  for (let i = SEGS; i >= 0; i--) {
    const t = i / SEGS
    const tN = (i + 1) / SEGS

    const spread = 0.88
    const lx = vpX - vpX * spread * (1 - t)
    const rx = vpX + (W - vpX) * spread * (1 - t)
    const ty = vpY - vpY * spread * (1 - t)
    const by = vpY + (H - vpY) * spread * (1 - t)

    const lxN = vpX - vpX * spread * (1 - tN)
    const rxN = vpX + (W - vpX) * spread * (1 - tN)
    const tyN = vpY - vpY * spread * (1 - tN)
    const byN = vpY + (H - vpY) * spread * (1 - tN)

    // Flicker affects brightness
    const flick = flickering && Math.random() < 0.12
    const b = flick ? Math.random() * 0.2 : 0.12 + t * 0.78

    // Ceiling
    ctx.fillStyle = `rgba(235,230,215,${b * 0.88})`
    ctx.beginPath()
    ctx.moveTo(lxN, tyN); ctx.lineTo(rxN, tyN)
    ctx.lineTo(rx, ty); ctx.lineTo(lx, ty)
    ctx.closePath(); ctx.fill()

    // Floor
    ctx.fillStyle = `rgba(170,165,150,${b * 0.78})`
    ctx.beginPath()
    ctx.moveTo(lxN, byN); ctx.lineTo(rxN, byN)
    ctx.lineTo(rx, by); ctx.lineTo(lx, by)
    ctx.closePath(); ctx.fill()

    // Left wall
    ctx.fillStyle = `rgba(215,210,195,${b * 0.82})`
    ctx.beginPath()
    ctx.moveTo(lxN, tyN); ctx.lineTo(lxN, byN)
    ctx.lineTo(lx, by); ctx.lineTo(lx, ty)
    ctx.closePath(); ctx.fill()

    // Right wall
    ctx.fillStyle = `rgba(205,200,185,${b * 0.78})`
    ctx.beginPath()
    ctx.moveTo(rxN, tyN); ctx.lineTo(rxN, byN)
    ctx.lineTo(rx, by); ctx.lineTo(rx, ty)
    ctx.closePath(); ctx.fill()

    // Baseboard
    const bh = (by - ty) * 0.055
    ctx.fillStyle = `rgba(175,170,155,${b * 0.9})`
    ctx.fillRect(lx, by - bh, rx - lx, bh)
    ctx.fillRect(lx, ty, rx - lx, bh * 0.4)

    // Floor tiles
    if (i % 2 === 0) {
      ctx.strokeStyle = `rgba(145,140,125,${b * 0.35})`
      ctx.lineWidth = 0.6
      ctx.beginPath(); ctx.moveTo(lxN, byN); ctx.lineTo(rxN, byN); ctx.stroke()
      const tw = rxN - lxN
      ;[1/3, 2/3].forEach(f => {
        ctx.beginPath()
        ctx.moveTo(lxN + tw * f, byN)
        ctx.lineTo(lx + (rx - lx) * f, by)
        ctx.stroke()
      })
    }

    // Fluorescent light fixture every 3 segments
    if (i % 3 === 0) {
      const fw = (rxN - lxN) * 0.28
      const fh = (byN - tyN) * 0.045
      const fx = lxN + (rxN - lxN) / 2 - fw / 2

      // Flicker the light itself
      const lightBright = flickering && Math.random() < 0.18 ? 0.1 : 1.3
      ctx.fillStyle = `rgba(255,251,215,${b * lightBright})`
      ctx.fillRect(fx, tyN + 1, fw, fh)

      // Light cast on scene
      const lg = ctx.createRadialGradient(vpX, tyN, 0, vpX, byN, (rxN - lxN) * 0.55)
      lg.addColorStop(0, `rgba(255,250,195,${b * 0.12 * lightBright})`)
      lg.addColorStop(1, 'transparent')
      ctx.fillStyle = lg
      ctx.beginPath()
      ctx.moveTo(lxN, tyN); ctx.lineTo(rxN, tyN)
      ctx.lineTo(rx, by); ctx.lineTo(lx, by)
      ctx.closePath(); ctx.fill()
    }
  }

  // End wall / door
  const dw = 26; const dh = 54
  ctx.fillStyle = `rgba(8,7,5,0.97)`
  ctx.fillRect(vpX - dw / 2, vpY - dh * 0.7, dw, dh)
  ctx.strokeStyle = 'rgba(180,170,150,0.12)'
  ctx.lineWidth = 1
  ctx.strokeRect(vpX - dw / 2, vpY - dh * 0.7, dw, dh)

  // Vignette
  const vig = ctx.createRadialGradient(vpX, vpY, H * 0.18, vpX, vpY, H * 0.88)
  vig.addColorStop(0, 'transparent')
  vig.addColorStop(1, 'rgba(4,3,2,0.72)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, W, H)

  // Depth darkening
  const depthFog = Math.max(0, 0.5 - (depthSteps / MAX_DEPTH) * 0.4)
  if (depthFog > 0) {
    ctx.fillStyle = `rgba(4,3,2,${depthFog})`
    ctx.fillRect(0, 0, W, H)
  }
}

export default function EchoRoom() {
  const navigate = useNavigate()
  const { startAmbient, stopAmbient, playStep, playFlickerSound } = useRoomSounds()
  const canvasRef = useRef(null)

  const [entered, setEntered] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [dir, setDir] = useState(0) // 0=N 1=E 2=S 3=W
  const [flickering, setFlickering] = useState(false)
  const [lore, setLore] = useState(null)
  const [loreShowing, setLoreShowing] = useState(false)
  const [steps, setSteps] = useState(0)
  const [atMax, setAtMax] = useState(false)
  const flickerRef = useRef(null)
  const loreRef = useRef(null)

  const depth = getDepth(pos)

  // Draw whenever pos/dir/flickering changes
  useEffect(() => {
    if (!entered) return
    drawHallway(canvasRef.current, depth, flickering)
  }, [pos, dir, flickering, entered, depth])

  // Flickering lights
  useEffect(() => {
    if (!entered) return
    const scheduleFlicker = () => {
      flickerRef.current = setTimeout(() => {
        setFlickering(true)
        playFlickerSound()
        setTimeout(() => setFlickering(false), 150 + Math.random() * 700)
        scheduleFlicker()
      }, 6000 + Math.random() * 22000)
    }
    scheduleFlicker()
    return () => clearTimeout(flickerRef.current)
  }, [entered, playFlickerSound])

  // Show lore when reaching certain depths
  const showLore = useCallback((newDepth) => {
    const text = LORE[newDepth]
    if (!text) return
    clearTimeout(loreRef.current)
    setLore(text)
    setLoreShowing(true)
    loreRef.current = setTimeout(() => setLoreShowing(false), 5500)
  }, [])

  const moveForward = useCallback(() => {
    const newPos = getForwardPos(pos, dir)
    const newDepth = getDepth(newPos)
    if (newDepth > MAX_DEPTH) return
    playStep()
    setPos(newPos)
    setSteps(s => s + 1)
    setAtMax(newDepth >= MAX_DEPTH)
    if (LORE[newDepth]) showLore(newDepth)
  }, [pos, dir, playStep, showLore])

  const moveBack = useCallback(() => {
    // Move backward = move in opposite direction
    const backDir = (dir + 2) % 4
    const newPos = getForwardPos(pos, backDir)
    const newDepth = getDepth(newPos)
    if (newDepth < 0) return
    playStep()
    setPos(newPos)
    setSteps(s => s + 1)
    setAtMax(false)
    if (LORE[newDepth]) showLore(newDepth)
  }, [pos, dir, playStep, showLore])

  const turnLeft = useCallback(() => {
    setDir(d => (d + 3) % 4)
    setSteps(s => s + 1)
  }, [])

  const turnRight = useCallback(() => {
    setDir(d => (d + 1) % 4)
    setSteps(s => s + 1)
  }, [])

  // Keyboard
  useEffect(() => {
    if (!entered) return
    const onKey = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); moveForward() }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { e.preventDefault(); moveBack() }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); turnLeft() }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); turnRight() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [entered, moveForward, moveBack, turnLeft, turnRight])

  const handleEnter = () => {
    setEntered(true)
    startAmbient()
    requestAnimationFrame(() => drawHallway(canvasRef.current, 0, false))
  }

  const handleExit = () => {
    stopAmbient()
    clearTimeout(flickerRef.current)
    clearTimeout(loreRef.current)
    navigate('/rooms')
  }

  // Entry screen
  if (!entered) return (
    <div style={{
      minHeight: '100vh', background: '#0c0b08',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: 'white', padding: '40px 20px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.8 }}
        style={{ textAlign: 'center', maxWidth: '420px' }}
      >
        <p style={{ margin: '0 0 8px', fontSize: '0.58rem', letterSpacing: '0.28em', color: 'rgba(210,200,180,0.35)' }}>
          LIMINAL ROOM I
        </p>
        <h1 style={{ margin: '0 0 24px', fontWeight: 300, fontSize: '2.2rem', letterSpacing: '0.18em', color: 'rgba(225,218,205,0.9)' }}>
          THE ECHO ROOM
        </h1>
        <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'rgba(210,200,180,0.5)', lineHeight: 2 }}>
          A hallway that never ends.<br />
          The lights know you are here.
        </p>
        <p style={{ margin: '0 0 40px', fontSize: '0.72rem', color: 'rgba(210,200,180,0.3)', lineHeight: 1.8 }}>
          ↑ W — forward &nbsp;·&nbsp; ↓ S — back<br />
          ← A — turn left &nbsp;·&nbsp; → D — turn right<br />
          or click the arrows on screen<br />
          <br />
          <span style={{ fontSize: '0.65rem', color: 'rgba(210,200,180,0.2)' }}>turn your sound on.</span>
        </p>
        <motion.button
          whileHover={{ scale: 1.04, borderColor: 'rgba(210,200,180,0.35)' }}
          whileTap={{ scale: 0.96 }}
          onClick={handleEnter}
          style={{
            padding: '14px 40px', fontSize: '0.72rem', letterSpacing: '0.22em',
            background: 'rgba(210,200,180,0.06)',
            border: '1px solid rgba(210,200,180,0.18)',
            color: 'rgba(210,200,180,0.8)', borderRadius: '999px', cursor: 'pointer',
            marginBottom: '20px',
          }}
        >
          ENTER THE HALLWAY
        </motion.button>
        <br />
        <button onClick={() => navigate('/rooms')}
          style={{ fontSize: '0.62rem', letterSpacing: '0.14em', color: 'rgba(210,200,180,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← BACK TO ROOMS
        </button>
      </motion.div>
    </div>
  )

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      background: '#0c0b08', position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>

      {/* HUD */}
      <div style={{
        position: 'fixed', top: '70px', left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 20px', zIndex: 50, pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', gap: '18px' }}>
          {[
            `DEPTH ${depth}`,
            `FACING ${DIR_NAMES[dir]}`,
            `${steps} STEPS`,
          ].map(t => (
            <span key={t} style={{ fontSize: '0.52rem', letterSpacing: '0.18em', color: 'rgba(210,200,180,0.25)', background: 'rgba(0,0,0,0.5)', padding: '3px 8px', borderRadius: '4px' }}>
              {t}
            </span>
          ))}
        </div>
        <button
          onClick={handleExit}
          style={{
            fontSize: '0.58rem', letterSpacing: '0.14em', padding: '6px 14px',
            background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(210,200,180,0.15)',
            color: 'rgba(210,200,180,0.4)', borderRadius: '6px', cursor: 'pointer',
            pointerEvents: 'all',
          }}
        >
          EXIT ROOM
        </button>
      </div>

      {/* Canvas */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '960px', aspectRatio: '16/9' }}>
        <motion.canvas
          ref={canvasRef}
          width={960}
          height={540}
          style={{ width: '100%', height: '100%', display: 'block' }}
          animate={{ opacity: flickering ? [1, 0.25, 1, 0.5, 1] : 1 }}
          transition={{ duration: flickering ? 0.25 : 0.12 }}
        />

        {/* Flicker brightness flash */}
        <AnimatePresence>
          {flickering && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.08, 0, 0.05, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(255,252,220,0.1)', pointerEvents: 'none' }}
            />
          )}
        </AnimatePresence>

        {/* Navigation arrows */}
        {/* Forward */}
        {depth < MAX_DEPTH && (
          <motion.div
            whileHover={{ opacity: 0.9, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={moveForward}
            style={{
              position: 'absolute', bottom: '18%', left: '50%',
              transform: 'translateX(-50%)',
              cursor: 'pointer', opacity: 0.4, zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            }}
          >
            <svg width="38" height="38" viewBox="0 0 38 38">
              <polygon points="19,4 34,30 4,30" fill="rgba(210,200,180,0.9)" />
            </svg>
            <span style={{ fontSize: '0.45rem', letterSpacing: '0.15em', color: 'rgba(210,200,180,0.7)' }}>FORWARD</span>
          </motion.div>
        )}

        {/* Back */}
        {depth > 0 && (
          <motion.div
            whileHover={{ opacity: 0.9, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={moveBack}
            style={{
              position: 'absolute', top: '12%', left: '50%',
              transform: 'translateX(-50%) rotate(180deg)',
              cursor: 'pointer', opacity: 0.35, zIndex: 10,
            }}
          >
            <svg width="38" height="38" viewBox="0 0 38 38">
              <polygon points="19,4 34,30 4,30" fill="rgba(210,200,180,0.9)" />
            </svg>
          </motion.div>
        )}

        {/* Turn left */}
        <motion.div
          whileHover={{ opacity: 0.9, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={turnLeft}
          style={{
            position: 'absolute', left: '2%', top: '50%',
            transform: 'translateY(-50%) rotate(-90deg)',
            cursor: 'pointer', opacity: 0.35, zIndex: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}
        >
          <svg width="38" height="38" viewBox="0 0 38 38">
            <polygon points="19,4 34,30 4,30" fill="rgba(210,200,180,0.9)" />
          </svg>
        </motion.div>

        {/* Turn right */}
        <motion.div
          whileHover={{ opacity: 0.9, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={turnRight}
          style={{
            position: 'absolute', right: '2%', top: '50%',
            transform: 'translateY(-50%) rotate(90deg)',
            cursor: 'pointer', opacity: 0.35, zIndex: 10,
          }}
        >
          <svg width="38" height="38" viewBox="0 0 38 38">
            <polygon points="19,4 34,30 4,30" fill="rgba(210,200,180,0.9)" />
          </svg>
        </motion.div>

        {/* Compass rose */}
        <div style={{
          position: 'absolute', bottom: '12px', right: '12px',
          width: '56px', height: '56px', zIndex: 10,
          opacity: 0.5,
        }}>
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="26" fill="rgba(0,0,0,0.5)" stroke="rgba(210,200,180,0.15)" strokeWidth="1" />
            {['N','E','S','W'].map((label, i) => {
              const angle = i * 90
              const isActive = i === dir
              const rad = (angle - 90) * Math.PI / 180
              const tx = 28 + Math.cos(rad) * 17
              const ty = 28 + Math.sin(rad) * 17
              return (
                <text key={label} x={tx} y={ty + 4}
                  textAnchor="middle" fontSize="8"
                  fill={isActive ? 'rgba(210,200,180,0.95)' : 'rgba(210,200,180,0.35)'}
                  fontFamily="monospace" letterSpacing="0.5"
                >{label}</text>
              )
            })}
            <circle cx="28" cy="28" r="3"
              fill={`rgba(${['200,180,255','180,200,255','255,160,160','160,200,255'][dir]},0.8)`} />
          </svg>
        </div>

        {/* Lore text */}
        <AnimatePresence>
          {loreShowing && lore && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.8 }}
              style={{
                position: 'absolute', bottom: '7%', left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center', pointerEvents: 'none', zIndex: 20,
                maxWidth: '420px', width: '90%',
              }}
            >
              <p style={{
                fontSize: '0.75rem', letterSpacing: '0.1em', lineHeight: 1.9,
                color: 'rgba(210,200,180,0.5)', fontStyle: 'italic',
                textShadow: '0 0 24px rgba(0,0,0,1)',
                background: 'rgba(0,0,0,0.3)', padding: '8px 16px', borderRadius: '6px',
              }}>
                {lore}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* At max depth */}
        <AnimatePresence>
          {atMax && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 2, delay: 1 }}
              style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center', zIndex: 25,
                background: 'rgba(0,0,0,0.6)', padding: '28px 36px', borderRadius: '12px',
                border: '1px solid rgba(210,200,180,0.12)',
              }}
            >
              <p style={{ margin: '0 0 16px', fontSize: '0.6rem', letterSpacing: '0.22em', color: 'rgba(210,200,180,0.4)' }}>
                YOU HAVE REACHED THE END.
              </p>
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={handleExit}
                style={{
                  padding: '10px 28px', fontSize: '0.62rem', letterSpacing: '0.18em',
                  background: 'rgba(210,200,180,0.07)',
                  border: '1px solid rgba(210,200,180,0.22)',
                  color: 'rgba(210,200,180,0.75)', borderRadius: '999px', cursor: 'pointer',
                }}
              >
                LEAVE THE HALLWAY
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls hint */}
      <div style={{
        position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
        fontSize: '0.46rem', letterSpacing: '0.14em', color: 'rgba(210,200,180,0.18)',
        pointerEvents: 'none', whiteSpace: 'nowrap',
      }}>
        W ↑ FORWARD &nbsp;·&nbsp; S ↓ BACK &nbsp;·&nbsp; A ← TURN LEFT &nbsp;·&nbsp; D → TURN RIGHT
      </div>
    </div>
  )
}