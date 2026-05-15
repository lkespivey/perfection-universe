import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { sound } from '../utils/sound'

// ── Sound engine ──────────────────────────────────────────
function useRoomSounds() {
  const ctxRef = useRef(null)
  const humRef = useRef(null)
  const echoTimer = useRef(null)

  const getCtx = () => {
    if (!ctxRef.current)
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    return ctxRef.current
  }

  const startAmbient = useCallback(() => {
    if (humRef.current) return
    try {
      const c = getCtx()
      const o1 = c.createOscillator()
      const o2 = c.createOscillator()
      const o3 = c.createOscillator()
      const g = c.createGain()
      o1.type = 'sine'; o1.frequency.value = 55
      o2.type = 'sine'; o2.frequency.value = 58.5
      o3.type = 'sine'; o3.frequency.value = 82
      g.gain.value = 0
      ;[o1, o2, o3].forEach(o => o.connect(g))
      g.connect(c.destination)
      ;[o1, o2, o3].forEach(o => o.start())
      g.gain.linearRampToValueAtTime(0.05, c.currentTime + 3)
      humRef.current = { o1, o2, o3, g }

      const scheduleEcho = () => {
        echoTimer.current = setTimeout(() => {
          try {
            const ec = getCtx()
            const eo = ec.createOscillator()
            const eg = ec.createGain()
            eo.type = 'sine'
            eo.frequency.value = 200 + Math.random() * 800
            eg.gain.value = 0.025
            eg.gain.exponentialRampToValueAtTime(0.0001, ec.currentTime + 3)
            eo.connect(eg); eg.connect(ec.destination)
            eo.start(); eo.stop(ec.currentTime + 3.5)
          } catch(e) {}
          scheduleEcho()
        }, 6000 + Math.random() * 16000)
      }
      scheduleEcho()
    } catch(e) {}
  }, [])

  const stopAmbient = useCallback(() => {
    clearTimeout(echoTimer.current)
    if (!humRef.current) return
    try {
      const c = getCtx()
      humRef.current.g.gain.linearRampToValueAtTime(0, c.currentTime + 1.5)
      setTimeout(() => {
        try { humRef.current?.o1.stop(); humRef.current?.o2.stop(); humRef.current?.o3.stop() } catch(e) {}
        humRef.current = null
      }, 2000)
    } catch(e) {}
  }, [])

  const playStep = useCallback(() => {
    try {
      const c = getCtx(); const t = c.currentTime
      // Wet footstep
      const o = c.createOscillator()
      const g = c.createGain()
      o.type = 'sine'; o.frequency.value = 120
      o.frequency.exponentialRampToValueAtTime(50, t + 0.08)
      g.gain.value = 0.12
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
      o.connect(g); g.connect(c.destination)
      o.start(t); o.stop(t + 0.25)
      // Water splash
      const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.1), c.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) * 0.3
      const src = c.createBufferSource()
      const sg = c.createGain()
      src.buffer = buf; sg.gain.value = 0.06
      src.connect(sg); sg.connect(c.destination); src.start(t + 0.02)
      // Echo
      setTimeout(() => {
        try {
          const c2 = getCtx(); const t2 = c2.currentTime
          const o2 = c2.createOscillator(); const g2 = c2.createGain()
          o2.type = 'sine'; o2.frequency.value = 100
          g2.gain.value = 0.03
          g2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.6)
          o2.connect(g2); g2.connect(c2.destination)
          o2.start(t2); o2.stop(t2 + 0.7)
        } catch(e) {}
      }, 500 + Math.random() * 300)
    } catch(e) {}
  }, [])

  const playRipple = useCallback(() => {
    try {
      const c = getCtx(); const t = c.currentTime
      const o = c.createOscillator()
      const g = c.createGain()
      o.type = 'sine'; o.frequency.value = 600
      o.frequency.exponentialRampToValueAtTime(200, t + 0.3)
      g.gain.value = 0.02
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4)
      o.connect(g); g.connect(c.destination)
      o.start(t); o.stop(t + 0.5)
    } catch(e) {}
  }, [])

  useEffect(() => () => stopAmbient(), [stopAmbient])
  return { startAmbient, stopAmbient, playStep, playRipple }
}

// ── Ripple system ─────────────────────────────────────────
function createRipple(x, y) {
  return { x, y, r: 0, maxR: 120 + Math.random() * 80, alpha: 0.6, id: Date.now() + Math.random() }
}

// ── Main canvas renderer ──────────────────────────────────
function drawScene(canvas, depth, ripples, time, flickerVal) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height

  // Sky / background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H * 0.62)
  bgGrad.addColorStop(0, '#0a0015')
  bgGrad.addColorStop(0.4, '#1a0035')
  bgGrad.addColorStop(0.75, '#3a0060')
  bgGrad.addColorStop(1, '#7a1090')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H * 0.62)

  // Horizon glow
  const hGlow = ctx.createRadialGradient(W * 0.62, H * 0.52, 0, W * 0.62, H * 0.52, W * 0.5)
  hGlow.addColorStop(0, `rgba(220,50,220,${0.55 + flickerVal * 0.08})`)
  hGlow.addColorStop(0.3, `rgba(180,0,220,${0.3 + flickerVal * 0.05})`)
  hGlow.addColorStop(0.7, 'rgba(120,0,180,0.1)')
  hGlow.addColorStop(1, 'transparent')
  ctx.fillStyle = hGlow
  ctx.fillRect(0, H * 0.2, W, H * 0.5)

  // Stars
  const starSeed = 42
  for (let i = 0; i < 180; i++) {
    const sx = ((i * 137.5 + starSeed) % 1) * W
    const sy = ((i * 97.3) % 1) * H * 0.55
    const sr = 0.4 + (i % 3) * 0.4
    const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(time * 0.8 + i * 0.7))
    ctx.beginPath()
    ctx.arc(sx, sy, sr, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(220,200,255,${twinkle * 0.7})`
    ctx.fill()
  }

  // Shooting stars occasionally
  const shootT = (time * 0.3) % 20
  if (shootT < 2) {
    const prog = shootT / 2
    const sx1 = W * 0.1 + prog * W * 0.3
    const sy1 = H * 0.05 + prog * H * 0.12
    ctx.beginPath()
    ctx.moveTo(sx1, sy1)
    ctx.lineTo(sx1 - 40 * prog, sy1 - 15 * prog)
    ctx.strokeStyle = `rgba(255,200,255,${(1 - prog) * 0.6})`
    ctx.lineWidth = 1.2
    ctx.stroke()
  }

  // Mountain silhouettes
  const drawMountains = (yBase, alpha, scale) => {
    ctx.fillStyle = `rgba(15,5,30,${alpha})`
    ctx.beginPath()
    ctx.moveTo(0, yBase)
    const pts = [
      [0.05, 0.88], [0.12, 0.72], [0.18, 0.82], [0.25, 0.65],
      [0.32, 0.78], [0.4, 0.7], [0.5, 0.62], [0.58, 0.71],
      [0.65, 0.6], [0.72, 0.68], [0.8, 0.74], [0.88, 0.65],
      [0.95, 0.76], [1.0, 0.82],
    ]
    pts.forEach(([x, y]) => ctx.lineTo(x * W, yBase - (yBase - H * y * scale)))
    ctx.lineTo(W, yBase); ctx.lineTo(0, yBase)
    ctx.closePath(); ctx.fill()
  }
  drawMountains(H * 0.56, 0.85, 0.95)
  drawMountains(H * 0.59, 0.7, 1.02)

  // Fog / mist layer
  const fogGrad = ctx.createLinearGradient(0, H * 0.5, 0, H * 0.65)
  fogGrad.addColorStop(0, 'transparent')
  fogGrad.addColorStop(0.5, 'rgba(140,20,180,0.25)')
  fogGrad.addColorStop(1, 'rgba(180,30,200,0.4)')
  ctx.fillStyle = fogGrad
  ctx.fillRect(0, H * 0.48, W, H * 0.18)

  // ── FLOOR (water) ──────────────────────────────────────
  const floorY = H * 0.615
  const floorGrad = ctx.createLinearGradient(0, floorY, 0, H)
  floorGrad.addColorStop(0, '#3a0055')
  floorGrad.addColorStop(0.3, '#220040')
  floorGrad.addColorStop(1, '#0e0020')
  ctx.fillStyle = floorGrad
  ctx.fillRect(0, floorY, W, H - floorY)

  // Water shimmer — thin film effect
  for (let i = 0; i < 12; i++) {
    const wy = floorY + (H - floorY) * (i / 12)
    const wAlpha = 0.03 + 0.05 * Math.sin(time * 1.2 + i * 0.8)
    ctx.fillStyle = `rgba(200,100,255,${wAlpha})`
    ctx.fillRect(0, wy, W, 2)
  }

  // ── CORRIDOR ───────────────────────────────────────────
  const vpX = W * 0.62
  const vpY = H * 0.52
  const corridorW = 180 + depth * 18
  const leftX = vpX - corridorW / 2
  const rightX = vpX + corridorW / 2
  const floorLineY = floorY

  // Perspective depth — how many wall segments
  const SEGS = 14
  for (let i = SEGS; i >= 1; i--) {
    const t = i / SEGS
    const tN = (i - 1) / SEGS

    const lx = vpX + (leftX - vpX) * t
    const rx = vpX + (rightX - vpX) * t
    const ty = vpY + (floorLineY - vpY) * t * 0.85
    const by = floorLineY + (H - floorLineY) * (1 - t) * 0.3

    const lxN = vpX + (leftX - vpX) * tN
    const rxN = vpX + (rightX - vpX) * tN
    const tyN = vpY + (floorLineY - vpY) * tN * 0.85
    const byN = floorLineY + (H - floorLineY) * (1 - tN) * 0.3

    const bri = 0.05 + t * 0.55

    // Left wall
    ctx.fillStyle = `rgba(40,5,70,${bri * 0.9})`
    ctx.beginPath()
    ctx.moveTo(lxN, tyN); ctx.lineTo(lxN, byN)
    ctx.lineTo(lx, by); ctx.lineTo(lx, ty)
    ctx.closePath(); ctx.fill()

    // Right wall
    ctx.fillStyle = `rgba(35,4,65,${bri * 0.85})`
    ctx.beginPath()
    ctx.moveTo(rxN, tyN); ctx.lineTo(rxN, byN)
    ctx.lineTo(rx, by); ctx.lineTo(rx, ty)
    ctx.closePath(); ctx.fill()

    // Ceiling
    ctx.fillStyle = `rgba(20,2,45,${bri})`
    ctx.beginPath()
    ctx.moveTo(lxN, tyN); ctx.lineTo(rxN, tyN)
    ctx.lineTo(rx, ty); ctx.lineTo(lx, ty)
    ctx.closePath(); ctx.fill()

    // Floor (water surface inside corridor)
    const floorAlpha = bri * 0.7
    ctx.fillStyle = `rgba(80,10,120,${floorAlpha})`
    ctx.beginPath()
    ctx.moveTo(lxN, byN); ctx.lineTo(rxN, byN)
    ctx.lineTo(rx, by); ctx.lineTo(lx, by)
    ctx.closePath(); ctx.fill()

    // Wall edge lines
    ctx.strokeStyle = `rgba(180,50,220,${bri * 0.4})`
    ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.moveTo(lx, ty); ctx.lineTo(lx, by); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(rx, ty); ctx.lineTo(rx, by); ctx.stroke()
  }

  // ── GLOWING DOOR ───────────────────────────────────────
  const doorProgress = Math.min(depth / 6, 1)
  const doorScale = 0.15 + doorProgress * 0.85
  const doorW = 55 * doorScale
  const doorH = 140 * doorScale
  const doorX = vpX - doorW / 2
  const doorY = vpY - doorH * 0.72

  // Door outer glow — large bloom
  const bloomR = (80 + doorProgress * 120) * (1 + flickerVal * 0.06)
  const bloom = ctx.createRadialGradient(vpX, vpY - doorH * 0.3 * doorScale, 0, vpX, vpY - doorH * 0.3 * doorScale, bloomR)
  bloom.addColorStop(0, `rgba(255,80,255,${0.35 + flickerVal * 0.05})`)
  bloom.addColorStop(0.2, `rgba(200,40,220,${0.2 + flickerVal * 0.03})`)
  bloom.addColorStop(0.5, `rgba(150,20,180,0.08)`)
  bloom.addColorStop(1, 'transparent')
  ctx.fillStyle = bloom
  ctx.fillRect(vpX - bloomR, vpY - bloomR * 1.2, bloomR * 2, bloomR * 2)

  // Door frame — dark structure like monolith
  ctx.fillStyle = `rgba(8,2,18,0.95)`
  ctx.fillRect(doorX - doorW * 0.15, doorY - 4, doorW * 1.3, doorH + 8)

  // Door inner glow
  const doorGlow = ctx.createRadialGradient(vpX, doorY + doorH * 0.4, 0, vpX, doorY + doorH * 0.4, doorW * 0.8)
  doorGlow.addColorStop(0, `rgba(255,150,255,${0.9 + flickerVal * 0.1})`)
  doorGlow.addColorStop(0.3, `rgba(220,80,240,0.7)`)
  doorGlow.addColorStop(0.7, `rgba(180,40,200,0.3)`)
  doorGlow.addColorStop(1, 'transparent')
  ctx.fillStyle = doorGlow
  ctx.fillRect(doorX, doorY, doorW, doorH)

  // Door bright center line
  ctx.fillStyle = `rgba(255,220,255,${0.95 + flickerVal * 0.05})`
  ctx.fillRect(vpX - 1.5, doorY, 3, doorH)

  // ── DOOR REFLECTION IN WATER ───────────────────────────
  // Mirror below floor line
  ctx.save()
  ctx.scale(1, -1)
  ctx.translate(0, -(floorLineY * 2))

  // Reflected bloom
  const reflBloom = ctx.createRadialGradient(vpX, -(floorLineY - (vpY - doorH * 0.3 * doorScale)), 0, vpX, -(floorLineY - (vpY - doorH * 0.3 * doorScale)), bloomR * 0.7)
  reflBloom.addColorStop(0, `rgba(255,80,255,${0.18 + flickerVal * 0.03})`)
  reflBloom.addColorStop(0.3, `rgba(180,30,200,0.08)`)
  reflBloom.addColorStop(1, 'transparent')
  ctx.fillStyle = reflBloom
  ctx.fillRect(vpX - bloomR, -(floorLineY) + 5, bloomR * 2, bloomR)

  ctx.restore()

  // Ripple glow on water surface
  const wGlow = ctx.createLinearGradient(doorX - 40, floorLineY, doorX + doorW + 40, floorLineY + 80)
  wGlow.addColorStop(0, 'transparent')
  wGlow.addColorStop(0.3, `rgba(200,50,230,${0.18 + flickerVal * 0.04})`)
  wGlow.addColorStop(0.7, `rgba(180,30,210,0.08)`)
  wGlow.addColorStop(1, 'transparent')
  ctx.fillStyle = wGlow
  ctx.fillRect(vpX - 200, floorLineY, 400, 120)

  // Water ripple lines
  for (let r = 0; r < 6; r++) {
    const ry = floorLineY + 15 + r * 18 + Math.sin(time * 0.6 + r) * 3
    const rAlpha = (0.3 - r * 0.04) * (1 - r / 7)
    ctx.beginPath()
    ctx.ellipse(vpX, ry, 60 + r * 40, 6 + r * 2, 0, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(220,100,255,${rAlpha})`
    ctx.lineWidth = 0.8
    ctx.stroke()
  }

  // ── WATER RIPPLES (from user movement) ─────────────────
  ripples.forEach(rip => {
    ctx.beginPath()
    ctx.ellipse(rip.x, rip.y, rip.r * 2, rip.r * 0.4, 0, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(200,100,255,${rip.alpha * 0.5})`
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(rip.x, rip.y, rip.r, rip.r * 0.2, 0, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(220,140,255,${rip.alpha * 0.3})`
    ctx.lineWidth = 0.6
    ctx.stroke()
  })

  // ── PATH LINES on floor ────────────────────────────────
  // Two perspective lines leading to door
  ctx.strokeStyle = `rgba(180,50,220,0.2)`
  ctx.lineWidth = 1
  ctx.setLineDash([8, 12])
  ctx.beginPath()
  ctx.moveTo(vpX - 20, H)
  ctx.lineTo(vpX - doorW * 0.3, floorLineY)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(vpX + 20, H)
  ctx.lineTo(vpX + doorW * 0.3, floorLineY)
  ctx.stroke()
  ctx.setLineDash([])

  // ── VIGNETTE ───────────────────────────────────────────
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, H * 0.85)
  vig.addColorStop(0, 'transparent')
  vig.addColorStop(1, 'rgba(2,0,8,0.72)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, W, H)
}

// ── Lore fragments ────────────────────────────────────────
const LORE_BY_DEPTH = {
  1: 'the water remembers every footstep.',
  2: 'you can hear yourself breathing. you were not aware of it before.',
  3: 'the door has always been there. you are only now walking toward it.',
  5: 'the echo is not your voice coming back. it is your voice going forward.',
  7: 'you are close enough now. whatever is on the other side can see you.',
}

export default function EchoRoom() {
  const navigate = useNavigate()
  const { startAmbient, stopAmbient, playStep, playRipple } = useRoomSounds()
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const timeRef = useRef(0)
  const ripplesRef = useRef([])
  const flickerRef = useRef(0)
  const flickerTimer = useRef(null)

  const [entered, setEntered] = useState(false)
  const [depth, setDepth] = useState(0)
  const [lore, setLore] = useState(null)
  const [loreShowing, setLoreShowing] = useState(false)
  const [atEnd, setAtEnd] = useState(false)
  const [steps, setSteps] = useState(0)
  const loreTimer = useRef(null)
  const MAX_DEPTH = 8

  // Animate loop
  useEffect(() => {
    if (!entered) return
    const canvas = canvasRef.current
    if (!canvas) return

    const loop = () => {
      timeRef.current += 0.016

      // Update ripples
      ripplesRef.current = ripplesRef.current
        .map(r => ({ ...r, r: r.r + 1.2, alpha: r.alpha - 0.008 }))
        .filter(r => r.alpha > 0.01 && r.r < r.maxR)

      // Random flicker
      flickerRef.current = Math.max(0, flickerRef.current - 0.05)

      drawScene(canvas, depth, ripplesRef.current, timeRef.current, flickerRef.current)
      animRef.current = requestAnimationFrame(loop)
    }

    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [entered, depth])

  // Random light flicker
  useEffect(() => {
    if (!entered) return
    const scheduleFlicker = () => {
      flickerTimer.current = setTimeout(() => {
        flickerRef.current = 0.4 + Math.random() * 0.6
        setTimeout(() => { flickerRef.current = 0 }, 100 + Math.random() * 400)
        scheduleFlicker()
      }, 4000 + Math.random() * 20000)
    }
    scheduleFlicker()
    return () => clearTimeout(flickerTimer.current)
  }, [entered])

  const showLore = useCallback((d) => {
    const text = LORE_BY_DEPTH[d]
    if (!text) return
    clearTimeout(loreTimer.current)
    setLore(text)
    setLoreShowing(true)
    loreTimer.current = setTimeout(() => setLoreShowing(false), 5000)
  }, [])

  const moveForward = useCallback(() => {
    if (depth >= MAX_DEPTH) return
    const newDepth = depth + 1
    playStep()

    // Spawn water ripple near bottom center
    const canvas = canvasRef.current
    if (canvas) {
      const rx = canvas.width * (0.5 + (Math.random() - 0.5) * 0.3)
      const ry = canvas.height * (0.75 + Math.random() * 0.15)
      ripplesRef.current.push(createRipple(rx, ry))
      playRipple()
    }

    setDepth(newDepth)
    setSteps(s => s + 1)
    setAtEnd(newDepth >= MAX_DEPTH)
    if (LORE_BY_DEPTH[newDepth]) showLore(newDepth)
  }, [depth, playStep, playRipple, showLore])

  const moveBack = useCallback(() => {
    if (depth <= 0) return
    const newDepth = depth - 1
    playStep()

    const canvas = canvasRef.current
    if (canvas) {
      const rx = canvas.width * (0.5 + (Math.random() - 0.5) * 0.3)
      const ry = canvas.height * (0.78 + Math.random() * 0.12)
      ripplesRef.current.push(createRipple(rx, ry))
    }

    setDepth(newDepth)
    setSteps(s => s + 1)
    setAtEnd(false)
  }, [depth, playStep])

  // Keyboard
  useEffect(() => {
    if (!entered) return
    const onKey = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); moveForward() }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { e.preventDefault(); moveBack() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [entered, moveForward, moveBack])

  // Click on lower half of canvas = move forward
  const handleCanvasClick = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const y = e.clientY - rect.top
    if (y > rect.height * 0.5) moveForward()
  }, [moveForward])

  const handleEnter = () => {
    setEntered(true)
    startAmbient()
  }

  const handleExit = () => {
    stopAmbient()
    clearTimeout(flickerTimer.current)
    clearTimeout(loreTimer.current)
    cancelAnimationFrame(animRef.current)
    navigate('/rooms')
  }

  // Entry screen
  if (!entered) return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a0015, #1a0035, #2a0050)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: 'white', padding: '40px 20px', textAlign: 'center',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.8 }}
        style={{ maxWidth: '440px' }}
      >
        {/* Preview glow orb */}
        <motion.div
          animate={{
            boxShadow: [
              '0 0 40px rgba(220,50,220,0.4)',
              '0 0 80px rgba(220,50,220,0.2)',
              '0 0 40px rgba(220,50,220,0.4)',
            ]
          }}
          transition={{ repeat: Infinity, duration: 3 }}
          style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,150,255,0.9), rgba(180,30,200,0.5))',
            margin: '0 auto 40px',
          }}
        />

        <p style={{ margin: '0 0 6px', fontSize: '0.58rem', letterSpacing: '0.3em', color: 'rgba(220,160,255,0.4)' }}>
          LIMINAL ROOM I
        </p>
        <h1 style={{ margin: '0 0 20px', fontWeight: 300, fontSize: '2.2rem', letterSpacing: '0.2em', color: 'rgba(230,200,255,0.95)' }}>
          THE ECHO ROOM
        </h1>
        <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'rgba(200,160,255,0.55)', lineHeight: 2 }}>
          A corridor that leads to a door that leads to somewhere.<br />
          Water covers the floor. The light is always ahead.
        </p>
        <p style={{ margin: '0 0 40px', fontSize: '0.7rem', color: 'rgba(200,160,255,0.3)', lineHeight: 1.9 }}>
          ↑ W or click to move forward &nbsp;·&nbsp; ↓ S to step back<br />
          <span style={{ fontSize: '0.62rem', color: 'rgba(200,160,255,0.18)' }}>turn your sound on.</span>
        </p>

        <motion.button
          whileHover={{ scale: 1.04, borderColor: 'rgba(220,100,255,0.5)' }}
          whileTap={{ scale: 0.96 }}
          onClick={handleEnter}
          style={{
            padding: '14px 44px', fontSize: '0.72rem', letterSpacing: '0.24em',
            background: 'rgba(200,50,220,0.1)',
            border: '1px solid rgba(200,80,220,0.25)',
            color: 'rgba(230,180,255,0.85)', borderRadius: '999px',
            cursor: 'pointer', marginBottom: '20px',
            transition: 'border-color 0.2s ease',
          }}
        >
          ENTER THE CORRIDOR
        </motion.button>
        <br />
        <button onClick={() => navigate('/rooms')}
          style={{
            fontSize: '0.62rem', letterSpacing: '0.14em',
            color: 'rgba(200,160,255,0.3)', background: 'none',
            border: 'none', cursor: 'pointer',
          }}>
          ← BACK TO ROOMS
        </button>
      </motion.div>
    </div>
  )

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      background: '#050010', position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>

      {/* HUD */}
      <div style={{
        position: 'fixed', top: '70px', left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between',
        padding: '0 20px', zIndex: 50, pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', gap: '14px' }}>
          {[
            `DEPTH ${depth} / ${MAX_DEPTH}`,
            `${steps} STEPS`,
          ].map(t => (
            <span key={t} style={{
              fontSize: '0.5rem', letterSpacing: '0.18em',
              color: 'rgba(220,160,255,0.3)',
              background: 'rgba(0,0,0,0.5)',
              padding: '3px 9px', borderRadius: '4px',
              fontFamily: 'monospace',
            }}>{t}</span>
          ))}
        </div>
        <button
          onClick={handleExit}
          style={{
            fontSize: '0.58rem', letterSpacing: '0.14em', padding: '6px 14px',
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(200,160,255,0.15)',
            color: 'rgba(200,160,255,0.45)',
            borderRadius: '6px', cursor: 'pointer', pointerEvents: 'all',
          }}
        >
          EXIT ROOM
        </button>
      </div>

      {/* Canvas */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '1100px', aspectRatio: '16/9' }}>
        <canvas
          ref={canvasRef}
          width={1100}
          height={618}
          onClick={handleCanvasClick}
          style={{
            width: '100%', height: '100%', display: 'block',
            cursor: depth < MAX_DEPTH ? 'pointer' : 'default',
          }}
        />

        {/* Depth progress bar */}
        <div style={{
          position: 'absolute', bottom: '8px', left: '50%',
          transform: 'translateX(-50%)',
          width: '180px', height: '2px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '1px',
        }}>
          <motion.div
            animate={{ width: `${(depth / MAX_DEPTH) * 100}%` }}
            transition={{ duration: 0.4 }}
            style={{
              height: '100%', borderRadius: '1px',
              background: 'rgba(220,100,255,0.7)',
            }}
          />
        </div>

        {/* Forward arrow */}
        {depth < MAX_DEPTH && (
          <motion.div
            animate={{ y: [0, -6, 0], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            onClick={moveForward}
            style={{
              position: 'absolute',
              bottom: '14%', left: '50%',
              transform: 'translateX(-50%)',
              cursor: 'pointer', zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32">
              <polygon points="16,3 29,26 3,26" fill="rgba(230,150,255,0.85)" />
            </svg>
            <span style={{ fontSize: '0.42rem', letterSpacing: '0.18em', color: 'rgba(230,150,255,0.6)' }}>
              FORWARD
            </span>
          </motion.div>
        )}

        {/* Back arrow */}
        {depth > 0 && (
          <motion.div
            whileHover={{ opacity: 0.8 }}
            onClick={moveBack}
            style={{
              position: 'absolute',
              top: '14%', left: '50%',
              transform: 'translateX(-50%) rotate(180deg)',
              cursor: 'pointer', opacity: 0.25, zIndex: 10,
            }}
          >
            <svg width="28" height="28" viewBox="0 0 32 32">
              <polygon points="16,3 29,26 3,26" fill="rgba(230,150,255,0.85)" />
            </svg>
          </motion.div>
        )}

        {/* Lore text */}
        <AnimatePresence>
          {loreShowing && lore && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              style={{
                position: 'absolute', bottom: '18%', left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center', pointerEvents: 'none', zIndex: 20,
                maxWidth: '400px', width: '90%',
              }}
            >
              <p style={{
                fontSize: '0.74rem', letterSpacing: '0.1em', lineHeight: 2,
                color: 'rgba(230,180,255,0.6)', fontStyle: 'italic',
                textShadow: '0 0 30px rgba(200,50,220,0.8), 0 0 60px rgba(150,20,180,0.4)',
              }}>
                {lore}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* At end of corridor */}
        <AnimatePresence>
          {atEnd && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 2.5, delay: 0.8 }}
              style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center', zIndex: 25,
                background: 'rgba(5,0,15,0.7)',
                padding: '28px 40px', borderRadius: '12px',
                border: '1px solid rgba(200,80,220,0.2)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 3 }}
                style={{ margin: '0 0 18px', fontSize: '0.62rem', letterSpacing: '0.22em', color: 'rgba(230,160,255,0.6)', fontFamily: 'monospace' }}
              >
                YOU STAND BEFORE THE DOOR.
              </motion.p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <motion.button
                  whileHover={{ scale: 1.05, borderColor: 'rgba(220,100,255,0.5)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExit}
                  style={{
                    padding: '10px 28px', fontSize: '0.62rem', letterSpacing: '0.18em',
                    background: 'rgba(200,50,220,0.1)',
                    border: '1px solid rgba(200,80,220,0.25)',
                    color: 'rgba(230,180,255,0.8)', borderRadius: '999px', cursor: 'pointer',
                  }}
                >
                  LEAVE THE CORRIDOR
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls hint */}
      <div style={{
        position: 'fixed', bottom: '14px', left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '0.44rem', letterSpacing: '0.14em',
        color: 'rgba(200,160,255,0.18)', pointerEvents: 'none', whiteSpace: 'nowrap',
      }}>
        ↑ W · CLICK LOWER HALF TO MOVE FORWARD &nbsp;·&nbsp; ↓ S TO STEP BACK
      </div>
    </div>
  )
}