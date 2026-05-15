import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { sound } from '../utils/sound'

const MAP_NODES = [
  {
    id: 'asteroids',
    label: 'DEBRIS FIELD',
    desc: 'A cluster of asteroids blocking the route to Mars. Something carved them.',
    x: 0.18, y: 0.32,
    path: '/games/asteroid-drift',
    locked: false,
    type: 'asteroids',
  },
  {
    id: 'signal',
    label: 'SIGNAL TOWER',
    desc: 'The source of the transmissions. Or one of them.',
    x: 0.42, y: 0.55,
    path: '/console',
    locked: false,
    type: 'signal',
  },
  {
    id: 'station',
    label: 'LIMINAL STATION',
    desc: 'A space station that does not appear on any official charts. The rooms inside shift.',
    x: 0.65, y: 0.70,
    path: '/rooms',
    locked: false,
    type: 'station',
  },
  {
    id: 'arcade',
    label: 'SIMULATION POD',
    desc: 'A detached module running game simulations.',
    x: 0.28, y: 0.68,
    path: '/games',
    locked: false,
    type: 'arcade',
  },
  {
    id: 'radar',
    label: 'BROKEN RADAR',
    desc: 'A radar dish pointing at nothing. Or something that does not want to be seen.',
    x: 0.72, y: 0.62,
    path: '/radar',
    locked: false,
    type: 'radar',
  },
  {
    id: 'archive',
    label: 'MISSION ARCHIVE',
    desc: 'Recovered documents from the voyage. PERFECTION\'s logs. The signal\'s version.',
    x: 0.52, y: 0.42,
    path: '/storyline',
    locked: false,
    type: 'archive',
  },
  // CHANGED: Mars is now always visible, never locked
  // Path and appearance change based on mars stage (handled in render)
  {
    id: 'mars',
    label: 'MARS',
    desc: 'The destination.',
    x: 0.85, y: 0.22,
    path: '/arrival',
    locked: false,
    type: 'mars',
  },
]

const EMOTION_KEYWORDS = {
  high: ['mars', 'alone', 'truth', 'real', 'cosmic', 'scars', 'lost', 'home', 'who', 'where'],
  mid: ['signal', 'remember', 'voice', 'memory', 'hear', 'know', 'find', 'change'],
}

function emotionScore(text) {
  const lower = text.toLowerCase()
  if (EMOTION_KEYWORDS.high.some(k => lower.includes(k))) return 0.85 + Math.random() * 0.15
  if (EMOTION_KEYWORDS.mid.some(k => lower.includes(k))) return 0.4 + Math.random() * 0.3
  return 0.1 + Math.random() * 0.2
}

// CHANGED: Mars node description and path change by stage
function getMarsNodeData(marsStage) {
  const stages = [
    {
      desc: '54.6 million kilometers. A red dot on long-range. You are heading there.',
      path: '/console',
      label: 'MARS — FAR',
      sublabel: 'STAGE 0 · APPROACH',
    },
    {
      desc: 'Getting closer. The signal says everything is on course.',
      path: '/console',
      label: 'MARS — NEAR',
      sublabel: 'STAGE 1 · IN RANGE',
    },
    {
      desc: 'Something is wrong with the trajectory. The signal is not responding normally.',
      path: '/console',
      label: 'MARS — PASSED',
      sublabel: 'STAGE 2 · OFF COURSE',
    },
    {
      desc: 'You arrived. Or something that looks like arrival. The signal was not honest about the destination.',
      path: '/arrival',
      label: 'MARS — REACHED',
      sublabel: 'STAGE 3 · TERMINAL',
    },
  ]
  return stages[Math.min(marsStage, 3)]
}

function NodeIllustration({ type, size = 52, active, marsStage = 0 }) {
  if (type === 'asteroids') return (
    <svg width={size} height={size} viewBox="0 0 52 52">
      <ellipse cx="16" cy="20" rx="9" ry="7" fill="#8a6a4a" stroke="#c4a06a" strokeWidth="1.2" />
      <ellipse cx="34" cy="30" rx="11" ry="8" fill="#7a5a3a" stroke="#b49060" strokeWidth="1" />
      <ellipse cx="24" cy="10" rx="5" ry="4" fill="#9a7a5a" stroke="#c4a06a" strokeWidth="0.8" />
      <ellipse cx="42" cy="18" rx="4" ry="3" fill="#6a4a2a" stroke="#a08050" strokeWidth="0.8" />
      {active && (
        <motion.circle cx="26" cy="24" r="22" fill="none" stroke="rgba(200,160,100,0.3)" strokeWidth="1"
          animate={{ r: [20, 24, 20] }} transition={{ repeat: Infinity, duration: 2 }} />
      )}
    </svg>
  )

  if (type === 'signal') return (
    <svg width={size} height={size} viewBox="0 0 52 52">
      <rect x="23" y="30" width="5" height="16" fill="#c0c0e0" />
      <rect x="18" y="42" width="16" height="4" fill="#a0a0c0" />
      <line x1="25" y1="30" x2="8" y2="12" stroke="#8080ff" strokeWidth="2.5" />
      <line x1="25" y1="30" x2="42" y2="12" stroke="#8080ff" strokeWidth="2.5" />
      <motion.line x1="25" y1="30" x2="25" y2="5" stroke="#a0a0ff" strokeWidth="3"
        animate={{ opacity: active ? [0.5, 1, 0.5] : 0.6 }}
        transition={{ repeat: Infinity, duration: 1.5 }} />
      {active && [8, 14, 20].map((r, i) => (
        <motion.circle key={i} cx="25" cy="30" r={r} fill="none"
          stroke={`rgba(120,120,255,${0.4 - i * 0.1})`} strokeWidth="1"
          animate={{ r: [r, r + 3, r], opacity: [0.4, 0.7, 0.4] }}
          transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }} />
      ))}
    </svg>
  )

  if (type === 'station') return (
    <svg width={size} height={size} viewBox="0 0 52 52">
      <rect x="19" y="19" width="14" height="14" rx="2" fill="#d0d0f0" stroke="#a0a0d0" strokeWidth="1.2" />
      <rect x="5" y="22" width="14" height="8" rx="1" fill="#b0b0e0" stroke="#9090c0" strokeWidth="1" />
      <rect x="33" y="22" width="14" height="8" rx="1" fill="#b0b0e0" stroke="#9090c0" strokeWidth="1" />
      <rect x="22" y="5" width="8" height="14" rx="1" fill="#b0b0e0" stroke="#9090c0" strokeWidth="1" />
      <rect x="22" y="33" width="8" height="14" rx="1" fill="#b0b0e0" stroke="#9090c0" strokeWidth="1" />
      <circle cx="26" cy="26" r="4" fill="#8080ff" />
      {active && (
        <motion.circle cx="26" cy="26" r="22" fill="none" stroke="rgba(160,160,255,0.4)" strokeWidth="1"
          animate={{ r: [20, 24, 20] }} transition={{ repeat: Infinity, duration: 3 }} />
      )}
    </svg>
  )

  if (type === 'arcade') return (
    <svg width={size} height={size} viewBox="0 0 52 52">
      <rect x="12" y="7" width="28" height="34" rx="4" fill="#202040" stroke="#6060a0" strokeWidth="1.5" />
      <rect x="16" y="12" width="20" height="12" rx="2" fill="#0a0a2a" stroke="#4040a0" strokeWidth="1" />
      <motion.rect x="17" y="13" width="8" height="5" fill="#00ff80"
        animate={{ opacity: active ? [0.3, 1, 0.3] : 0.5 }}
        transition={{ repeat: Infinity, duration: 0.8 }} />
      <motion.rect x="27" y="13" width="8" height="5" fill="#ff4080"
        animate={{ opacity: active ? [0.3, 1, 0.3] : 0.5 }}
        transition={{ repeat: Infinity, duration: 1.1, delay: 0.3 }} />
      <circle cx="21" cy="33" r="4" fill="#4040a0" stroke="#8080c0" strokeWidth="1" />
      <rect x="28" y="30" width="5" height="5" rx="1" fill="#4040a0" stroke="#8080c0" strokeWidth="1" />
      <rect x="12" y="41" width="28" height="5" rx="2" fill="#181830" stroke="#5050a0" strokeWidth="1" />
    </svg>
  )

  if (type === 'radar') return (
    <svg width={size} height={size} viewBox="0 0 52 52">
      <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(0,200,80,0.25)" strokeWidth="1" />
      <circle cx="26" cy="26" r="13" fill="none" stroke="rgba(0,200,80,0.2)" strokeWidth="1" />
      <circle cx="26" cy="26" r="6" fill="none" stroke="rgba(0,200,80,0.3)" strokeWidth="1" />
      <motion.line x1="26" y1="26" x2="26" y2="6" stroke="rgba(0,255,80,0.85)" strokeWidth="2"
        style={{ transformOrigin: '26px 26px' }}
        animate={{ rotate: [0, 360] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'linear' }} />
      <circle cx="26" cy="26" r="2.5" fill="rgba(0,255,80,0.9)" />
      <line x1="6" y1="26" x2="46" y2="26" stroke="rgba(0,200,80,0.12)" strokeWidth="0.8" />
      <line x1="26" y1="6" x2="26" y2="46" stroke="rgba(0,200,80,0.12)" strokeWidth="0.8" />
      {active && (
        <motion.circle cx="36" cy="16" r="3" fill="rgba(0,255,80,0.9)"
          animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2 }} />
      )}
    </svg>
  )

  if (type === 'archive') return (
    <svg width={size} height={size} viewBox="0 0 52 52">
      <rect x="10" y="14" width="32" height="26" rx="2" fill="#1a1830" stroke="#6060a0" strokeWidth="1.2" />
      <rect x="14" y="18" width="24" height="3" rx="1" fill="#8080c0" opacity="0.7" />
      <rect x="14" y="24" width="20" height="2" rx="1" fill="#6060a0" opacity="0.5" />
      <rect x="14" y="29" width="22" height="2" rx="1" fill="#6060a0" opacity="0.4" />
      <rect x="14" y="34" width="16" height="2" rx="1" fill="#6060a0" opacity="0.3" />
      <rect x="8" y="11" width="36" height="4" rx="1" fill="#252245" stroke="#5050a0" strokeWidth="1" />
      {active && (
        <motion.rect x="10" y="14" width="32" height="26" rx="2" fill="none"
          stroke="rgba(120,120,255,0.5)" strokeWidth="1"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }} />
      )}
    </svg>
  )

  // CHANGED: Mars illustration changes color/glow based on mars stage
  if (type === 'mars') {
    const stageColors = [
      // Stage 0 — small, far, dim
      { inner: '#c04030', outer: '#4a0a05', glow: 'rgba(200,60,40,0.4)', size: 0.7 },
      // Stage 1 — getting closer, brighter
      { inner: '#d85040', outer: '#6a1008', glow: 'rgba(220,80,40,0.5)', size: 0.85 },
      // Stage 2 — large, wrong, something off
      { inner: '#e06050', outer: '#8a1a0a', glow: 'rgba(255,100,40,0.6)', size: 1.0 },
      // Stage 3 — reached, pulsing red
      { inner: '#ff7a5a', outer: '#8b1a0a', glow: 'rgba(255,80,40,0.8)', size: 1.15 },
    ]
    const sc = stageColors[Math.min(marsStage, 3)]
    const r = 14 * sc.size

    return (
      <svg width={size} height={size} viewBox="0 0 52 52">
        <defs>
          <radialGradient id={`mg${marsStage}`} cx="38%" cy="35%">
            <stop offset="0%" stopColor={sc.inner} />
            <stop offset="100%" stopColor={sc.outer} />
          </radialGradient>
        </defs>
        {/* Stage 3 gets an extra outer pulse ring */}
        {marsStage >= 3 && (
          <motion.circle cx="26" cy="26" r="24" fill="none"
            stroke="rgba(255,80,40,0.25)" strokeWidth="1"
            animate={{ r: [22, 26, 22], opacity: [0.2, 0.5, 0.2] }}
            transition={{ repeat: Infinity, duration: 2 }} />
        )}
        <circle cx="26" cy="26" r={r} fill={`url(#mg${marsStage})`} />
        <ellipse cx={26 - r * 0.3} cy={26 - r * 0.2} rx={r * 0.35} ry={r * 0.15} fill="rgba(0,0,0,0.2)" />
        <ellipse cx={26 + r * 0.1} cy={26 + r * 0.25} rx={r * 0.42} ry={r * 0.18} fill="rgba(0,0,0,0.15)" />
        {active && (
          <motion.circle cx="26" cy="26" r={r + 6} fill="none"
            stroke={sc.glow} strokeWidth="1.5"
            animate={{ r: [r + 4, r + 8, r + 4] }}
            transition={{ repeat: Infinity, duration: 2.5 }} />
        )}
      </svg>
    )
  }

  return null
}

function ConstellationMap({ messages, onClose }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width; const H = canvas.height
    ctx.fillStyle = '#02000a'
    ctx.fillRect(0, 0, W, H)
    for (let i = 0; i < 120; i++) {
      ctx.beginPath()
      ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 0.8, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(200,180,255,${Math.random() * 0.3 + 0.1})`
      ctx.fill()
    }
    if (!messages || messages.length === 0) {
      ctx.fillStyle = 'rgba(200,160,255,0.4)'
      ctx.font = '11px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('NO TRANSMISSIONS YET.', W / 2, H / 2 - 10)
      ctx.fillText('SPEAK TO THE SIGNAL FIRST.', W / 2, H / 2 + 10)
      return
    }
    const points = messages.map((msg, i) => ({
      x: 30 + ((i / Math.max(messages.length - 1, 1)) * (W - 60)),
      y: H - 30 - (emotionScore(msg) * (H - 60)),
      emotion: emotionScore(msg),
    }))
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i]; const b = points[i + 1]
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
      ctx.strokeStyle = `rgba(180,140,255,${0.06 + (a.emotion + b.emotion) / 2 * 0.12})`
      ctx.lineWidth = 0.8; ctx.stroke()
    }
    points.forEach(p => {
      const r = 1.5 + p.emotion * 4
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.5)
      grd.addColorStop(0, `rgba(230,200,255,${0.7 + p.emotion * 0.3})`)
      grd.addColorStop(1, 'transparent')
      ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.5, 0, Math.PI * 2)
      ctx.fillStyle = grd; ctx.fill()
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,230,255,0.9)'; ctx.fill()
    })
    ctx.fillStyle = 'rgba(200,160,255,0.2)'
    ctx.font = '9px monospace'; ctx.textAlign = 'left'
    ctx.fillText('TIME →', 20, H - 10)
    ctx.save(); ctx.rotate(-Math.PI / 2)
    ctx.fillText('SIGNAL DEPTH →', -H + 20, 14); ctx.restore()
  }, [messages])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#02000a', borderRadius: '16px',
          border: '1px solid rgba(200,160,255,0.2)',
          padding: '24px', maxWidth: '560px', width: '90%',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '0.55rem', letterSpacing: '0.22em', color: 'rgba(200,160,255,0.4)' }}>YOUR CONSTELLATION</p>
            <h3 style={{ margin: 0, fontWeight: 300, fontSize: '1rem', letterSpacing: '0.15em', color: 'white' }}>SIGNAL HISTORY MAP</h3>
          </div>
          <button onClick={onClose} style={{ fontSize: '0.65rem', letterSpacing: '0.12em', padding: '6px 14px' }}>CLOSE</button>
        </div>
        <canvas ref={canvasRef} width={500} height={280}
          style={{ width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }} />
        <p style={{ margin: '12px 0 0', fontSize: '0.68rem', color: 'rgba(200,160,255,0.3)', textAlign: 'center', lineHeight: 1.6 }}>
          Each star is a message you sent. Brighter = more signal depth. Time flows left to right.
        </p>
      </motion.div>
    </motion.div>
  )
}

export default function Map() {
  const navigate = useNavigate()
  const { user } = useAuth()
  // CHANGED: use a ref for the map window div so we can attach non-passive wheel
  const mapAreaRef = useRef(null)
  const canvasRef = useRef(null)
  const starsRef = useRef([])
  const nebulaeRef = useRef([])
  const animRef = useRef(null)
  // CHANGED: dragRef tracks drag state without stale closures
  const dragRef = useRef({ dragging: false, moved: false, startX: 0, startY: 0, panX: 0, panY: 0 })

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [activeNode, setActiveNode] = useState(null)
  const [showConstellation, setShowConstellation] = useState(false)
  const [messages, setMessages] = useState([])
  const [marsStage, setMarsStage] = useState(0)
  const [clockSeconds, setClockSeconds] = useState(0)
  const [radarAngle, setRadarAngle] = useState(0)
  const [signalPulse, setSignalPulse] = useState(false)

  useEffect(() => {
    starsRef.current = [
      ...Array.from({ length: 200 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 0.8 + 0.2, opacity: Math.random() * 0.4 + 0.1, layer: 0, twinkle: Math.random(), twinkleSpeed: 0.002 + Math.random() * 0.004 })),
      ...Array.from({ length: 100 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.2 + 0.5, opacity: Math.random() * 0.5 + 0.2, layer: 1, twinkle: Math.random(), twinkleSpeed: 0.003 + Math.random() * 0.005 })),
      ...Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.8 + 0.8, opacity: Math.random() * 0.6 + 0.3, layer: 2, twinkle: Math.random(), twinkleSpeed: 0.005 + Math.random() * 0.008 })),
    ]
    nebulaeRef.current = Array.from({ length: 6 }, (_, i) => ({
      x: 0.1 + Math.random() * 0.8, y: 0.1 + Math.random() * 0.8,
      rx: 80 + Math.random() * 120, ry: 60 + Math.random() * 80,
      hue: [260, 280, 300, 240, 200, 320][i],
      opacity: 0.04 + Math.random() * 0.06,
      rotation: Math.random() * Math.PI,
    }))
  }, [])

  useEffect(() => {
    if (user) {
      setMarsStage(user.profile?.mars_stage ?? 0)
      setMessages(user.profile?.memory_log ?? [])
    }
  }, [user])

  useEffect(() => {
    const iv1 = setInterval(() => setClockSeconds(p => p + 1), 1000)
    const iv2 = setInterval(() => setRadarAngle(p => (p + 3) % 360), 50)
    const iv3 = setInterval(() => setSignalPulse(p => !p), 15000)
    return () => { clearInterval(iv1); clearInterval(iv2); clearInterval(iv3) }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    function draw() {
      const W = canvas.width; const H = canvas.height
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#01000a'; ctx.fillRect(0, 0, W, H)
      nebulaeRef.current.forEach(n => {
        ctx.save(); ctx.translate(n.x * W, n.y * H); ctx.rotate(n.rotation)
        const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, n.rx)
        grd.addColorStop(0, `hsla(${n.hue},60%,50%,${n.opacity * 1.5})`)
        grd.addColorStop(0.5, `hsla(${n.hue},50%,40%,${n.opacity})`)
        grd.addColorStop(1, 'transparent')
        ctx.scale(1, n.ry / n.rx); ctx.beginPath()
        ctx.arc(0, 0, n.rx, 0, Math.PI * 2)
        ctx.fillStyle = grd; ctx.fill(); ctx.restore()
      })
      starsRef.current.forEach(s => {
        const lp = [0.02, 0.06, 0.12][s.layer]
        const px = ((s.x * W) + pan.x * lp) % W
        const py = ((s.y * H) + pan.y * lp) % H
        s.twinkle += s.twinkleSpeed
        const op = s.opacity * (0.7 + 0.3 * Math.sin(s.twinkle * Math.PI * 2))
        ctx.beginPath()
        ctx.arc(px < 0 ? px + W : px, py < 0 ? py + H : py, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(220,210,255,${op})`; ctx.fill()
      })
      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [pan])

  // CHANGED: non-passive wheel listener attached via ref
  useEffect(() => {
    const el = mapAreaRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      setZoom(prev => Math.max(0.5, Math.min(3, prev - e.deltaY * 0.001)))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // CHANGED: drag uses ref-based approach to avoid stale closures
  // This is the root cause of why some nodes weren't clickable —
  // the drag state was going stale and treating real clicks as drags
  const onMouseDown = useCallback((e) => {
    dragRef.current = {
      dragging: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    }
  }, [pan])

  const onMouseMove = useCallback((e) => {
    if (!dragRef.current.dragging) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    // CHANGED: only count as a drag if moved more than 6px
    // previously was 4px which caused accidental drag detection on clicks
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      dragRef.current.moved = true
    }
    if (dragRef.current.moved) {
      setPan({ x: dragRef.current.panX + dx, y: dragRef.current.panY + dy })
    }
  }, [])

  const onMouseUp = useCallback(() => {
    dragRef.current.dragging = false
  }, [])

  // CHANGED: Mars node click handler is aware of mars stage
  // and routes to the appropriate destination
  const handleNodeClick = useCallback((e, node) => {
    e.stopPropagation()
    // If this was a drag, ignore the click
    if (dragRef.current.moved) return

    sound.hover()

    // CHANGED: for Mars, use stage-based path
    if (node.id === 'mars') {
      if (activeNode?.id === 'mars') {
        const marsData = getMarsNodeData(marsStage)
        sound.pageWhoosh()
        navigate(marsData.path)
      } else {
        setActiveNode(node)
      }
      return
    }

    if (activeNode?.id === node.id) {
      sound.pageWhoosh()
      navigate(node.path)
    } else {
      setActiveNode(node)
    }
  }, [activeNode, marsStage, navigate])

  const handleNavigate = useCallback((e, path) => {
    e.stopPropagation()
    sound.pageWhoosh()
    navigate(path)
  }, [navigate])

  const formatClock = (s) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0')
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${h}:${m}:${sec}`
  }

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      background: '#01000a', position: 'relative',
      fontFamily: 'system-ui, sans-serif', color: 'white',
      userSelect: 'none',
    }}>

      {/* Space window */}
      <div
        ref={mapAreaRef}
        style={{
          position: 'absolute',
          top: 0, left: '72px', right: 0, bottom: '140px',
          overflow: 'hidden',
          // CHANGED: cursor shows grab vs grabbing based on drag state
          cursor: dragRef.current?.dragging && dragRef.current?.moved ? 'grabbing' : 'grab',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <canvas ref={canvasRef}
          width={window.innerWidth - 72}
          height={window.innerHeight - 140}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />

        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          boxShadow: 'inset 0 0 80px rgba(1,0,10,0.6), inset 0 0 20px rgba(200,180,255,0.04)',
        }} />

        {/* CHANGED: nodes container — pointerEvents none on container,
            all on individual nodes. This fixes the asteroid/station click issue
            where the canvas was intercepting events */}
        <div style={{
          position: 'absolute', inset: 0,
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: 'center center',
          pointerEvents: 'none', // container is none
        }}>
          {MAP_NODES.map(node => {
            const isActive = activeNode?.id === node.id

            // CHANGED: get dynamic mars data for the mars node
            const marsData = node.id === 'mars' ? getMarsNodeData(marsStage) : null
            const displayLabel = marsData ? marsData.label : node.label
            const displayDesc = marsData ? marsData.desc : node.desc
            const displayPath = marsData ? marsData.path : node.path

            return (
              <div
                key={node.id}
                style={{
                  position: 'absolute',
                  left: `${node.x * 100}%`,
                  top: `${node.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  // CHANGED: pointerEvents all on each individual node
                  // This was the main fix — previously some nodes were being
                  // blocked by the container's pointer event handling
                  pointerEvents: 'all',
                  cursor: 'pointer',
                  zIndex: isActive ? 20 : 1,
                }}
                // CHANGED: stopPropagation on mousedown prevents drag from
                // starting when clicking a node
                onMouseDown={e => { e.stopPropagation(); dragRef.current.moved = false }}
                onClick={(e) => handleNodeClick(e, node)}
              >
                {isActive && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{
                      position: 'absolute', width: '90px', height: '90px', borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(200,160,255,0.15), transparent)',
                      left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                    }}
                  />
                )}

                <motion.div
                  animate={isActive ? { y: [0, -5, 0] } : {}}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  {/* CHANGED: pass marsStage to NodeIllustration so Mars changes appearance */}
                  <NodeIllustration type={node.type} size={52} active={isActive} marsStage={marsStage} />
                </motion.div>

                <div style={{
                  marginTop: '8px', fontSize: '0.52rem', letterSpacing: '0.18em',
                  color: isActive ? 'rgba(230,210,255,1)' : 'rgba(200,160,255,0.6)',
                  textAlign: 'center', whiteSpace: 'nowrap',
                  textShadow: '0 2px 8px rgba(0,0,0,1)',
                  background: 'rgba(0,0,0,0.45)',
                  padding: '2px 7px', borderRadius: '4px',
                }}>
                  {displayLabel}
                </div>

                {/* CHANGED: mars sublabel shows stage info */}
                {node.id === 'mars' && marsData?.sublabel && (
                  <div style={{
                    marginTop: '3px', fontSize: '0.42rem', letterSpacing: '0.12em',
                    color: marsStage >= 3 ? 'rgba(255,100,80,0.7)' : 'rgba(200,160,255,0.4)',
                    background: 'rgba(0,0,0,0.4)',
                    padding: '1px 6px', borderRadius: '3px',
                    whiteSpace: 'nowrap',
                  }}>
                    {marsData.sublabel}
                  </div>
                )}

                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.92 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        position: 'absolute', top: 'calc(100% + 10px)',
                        left: '50%', transform: 'translateX(-50%)',
                        background: 'rgba(4,0,18,0.97)',
                        border: '1px solid rgba(200,160,255,0.3)',
                        borderRadius: '12px', padding: '16px 18px',
                        width: '210px', zIndex: 30,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                        pointerEvents: 'all',
                      }}
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => e.stopPropagation()}
                    >
                      <p style={{ margin: '0 0 6px', fontSize: '0.62rem', letterSpacing: '0.15em', color: 'rgba(220,200,255,0.95)', fontWeight: 600 }}>
                        {displayLabel}
                      </p>
                      <p style={{ margin: '0 0 14px', fontSize: '0.74rem', color: 'rgba(200,160,255,0.5)', lineHeight: 1.6 }}>
                        {displayDesc}
                      </p>
                      {/* CHANGED: Mars shows stage-aware destination in button */}
                      <button
                        onClick={(e) => handleNavigate(e, displayPath)}
                        style={{
                          width: '100%', padding: '9px 0',
                          background: node.id === 'mars' && marsStage >= 3
                            ? 'rgba(255,80,40,0.15)'  // CHANGED: red tint for reached mars
                            : 'rgba(200,160,255,0.12)',
                          border: `1px solid ${node.id === 'mars' && marsStage >= 3
                            ? 'rgba(255,80,40,0.4)'
                            : 'rgba(200,160,255,0.35)'}`,
                          borderRadius: '8px',
                          color: node.id === 'mars' && marsStage >= 3
                            ? 'rgba(255,160,140,0.9)'
                            : 'rgba(220,200,255,0.9)',
                          fontSize: '0.62rem', letterSpacing: '0.16em',
                          cursor: 'pointer',
                        }}
                      >
                        {/* CHANGED: Mars button text changes by stage */}
                        {node.id === 'mars'
                          ? marsStage >= 3
                            ? 'VIEW ARRIVAL →'
                            : 'OPEN CONSOLE →'
                          : 'ENTER →'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        {activeNode && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}
            onClick={() => setActiveNode(null)} />
        )}

        <div style={{ position: 'absolute', top: 14, right: 14, fontSize: '0.5rem', letterSpacing: '0.14em', color: 'rgba(200,160,255,0.2)', pointerEvents: 'none' }}>
          SCROLL TO ZOOM · DRAG TO PAN · CLICK NODES
        </div>
        <div style={{ position: 'absolute', bottom: 10, right: 14, fontSize: '0.5rem', letterSpacing: '0.1em', color: 'rgba(200,160,255,0.15)', pointerEvents: 'none' }}>
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Left panel */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '72px',
        background: 'linear-gradient(180deg, #0e0020, #06001a)',
        borderRight: '1.5px solid rgba(200,180,255,0.18)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: '12px', gap: '8px', zIndex: 50,
      }}>
        <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
          onClick={() => { sound.click(); navigate('/') }}
          style={{
            width: '44px', height: '36px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(200,180,255,0.2)',
            color: 'rgba(200,160,255,0.7)', fontSize: '0.7rem', cursor: 'pointer', padding: 0,
          }}
        >←</motion.button>

        <div style={{ width: '40px', height: '1px', background: 'rgba(200,160,255,0.1)' }} />

        <motion.div whileHover={{ scale: 1.06 }}
          onClick={() => { sound.click(); navigate('/radar') }}
          title="Broken Radar"
          style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: '#000a02', border: '1.5px solid rgba(0,200,80,0.35)',
            cursor: 'pointer', position: 'relative', overflow: 'hidden',
          }}
        >
          <svg width="48" height="48" style={{ position: 'absolute', inset: 0 }}>
            <circle cx="24" cy="24" r="10" fill="none" stroke="rgba(0,200,80,0.15)" strokeWidth="1" />
            <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(0,200,80,0.1)" strokeWidth="1" />
            <line x1="6" y1="24" x2="42" y2="24" stroke="rgba(0,200,80,0.1)" strokeWidth="0.8" />
            <line x1="24" y1="6" x2="24" y2="42" stroke="rgba(0,200,80,0.1)" strokeWidth="0.8" />
            <line
              x1="24" y1="24"
              x2={24 + Math.cos((radarAngle - 90) * Math.PI / 180) * 18}
              y2={24 + Math.sin((radarAngle - 90) * Math.PI / 180) * 18}
              stroke="rgba(0,255,80,0.8)" strokeWidth="1.5"
            />
            <circle cx="24" cy="24" r="2" fill="rgba(0,255,80,0.9)" />
          </svg>
          <div style={{ position: 'absolute', bottom: '3px', left: 0, right: 0, fontSize: '0.38rem', letterSpacing: '0.08em', color: 'rgba(0,255,80,0.5)', textAlign: 'center' }}>
            RADAR
          </div>
        </motion.div>

        <motion.div whileHover={{ scale: 1.06 }}
          onClick={() => { sound.click(); navigate('/console') }}
          title="Ship Console"
          style={{
            width: '48px', height: '48px', borderRadius: '10px',
            background: 'rgba(80,80,200,0.08)', border: '1.5px solid rgba(120,120,255,0.3)',
            cursor: 'pointer', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '3px',
          }}
        >
          {[0, 1, 2].map(i => (
            <motion.div key={i}
              animate={{ opacity: [0.3, 1, 0.3], width: [`${58 + i * 10}%`, `${78 + i * 8}%`, `${58 + i * 10}%`] }}
              transition={{ repeat: Infinity, duration: 1.5 + i * 0.3, delay: i * 0.2 }}
              style={{ height: '2px', borderRadius: '1px', background: 'rgba(120,120,255,0.7)' }}
            />
          ))}
          <div style={{ fontSize: '0.36rem', letterSpacing: '0.08em', color: 'rgba(120,120,255,0.6)', marginTop: '2px' }}>CONSOLE</div>
        </motion.div>

        <motion.div whileHover={{ scale: 1.06 }}
          onClick={() => { sound.dreamFloat(); setShowConstellation(true) }}
          title="Your Constellation Map"
          style={{
            width: '48px', height: '48px', borderRadius: '10px',
            background: 'rgba(160,80,255,0.06)', border: '1.5px solid rgba(180,120,255,0.25)',
            cursor: 'pointer', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '2px',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28">
            {[[4,8],[14,4],[24,10],[20,20],[8,22],[16,14]].map(([x,y], i, arr) => (
              <g key={i}>
                <line x1={x} y1={y} x2={arr[(i+1)%arr.length][0]} y2={arr[(i+1)%arr.length][1]}
                  stroke="rgba(180,120,255,0.3)" strokeWidth="0.8" />
                <motion.circle cx={x} cy={y} r="1.5" fill="rgba(220,180,255,0.8)"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2 + i * 0.4, delay: i * 0.3 }} />
              </g>
            ))}
          </svg>
          <div style={{ fontSize: '0.34rem', letterSpacing: '0.06em', color: 'rgba(180,120,255,0.5)' }}>CONST.</div>
        </motion.div>

        <div style={{ flex: 1 }} />

        <motion.div whileHover={{ scale: 1.04 }}
          onClick={() => { sound.click(); navigate('/radar') }}
          title="counting the centuries day by day."
          style={{ width: '56px', marginBottom: '12px', textAlign: 'center', cursor: 'pointer' }}
        >
          <div style={{ fontSize: '0.42rem', letterSpacing: '0.05em', color: 'rgba(200,160,255,0.2)', lineHeight: 1.4, fontFamily: 'monospace' }}>
            {formatClock(clockSeconds)}
          </div>
          <div style={{ fontSize: '0.3rem', letterSpacing: '0.06em', color: 'rgba(200,160,255,0.1)', marginTop: '2px' }}>SHIP TIME</div>
        </motion.div>
      </div>

      {/* Bottom cockpit */}
      <div style={{
        position: 'absolute', left: '72px', right: 0, bottom: 0, height: '140px',
        background: 'linear-gradient(180deg, #080018, #0a001e)',
        borderTop: '2px solid rgba(200,180,255,0.18)',
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: '20px', zIndex: 50,
      }}>
        <div style={{ minWidth: '140px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '0.5rem', letterSpacing: '0.2em', color: 'rgba(200,160,255,0.35)' }}>VESSEL I · COSMIC SCARS</p>
          <p style={{ margin: '0 0 8px', fontSize: '0.82rem', fontWeight: 300, letterSpacing: '0.1em', color: 'rgba(220,200,255,0.8)' }}>NAVIGATION SYSTEM</p>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {[0,1,2,3].map(i => (
              <motion.div key={i} animate={{ opacity: i <= marsStage ? 1 : 0.15 }}
                style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: i <= marsStage
                    ? ['rgba(200,160,255,0.6)','rgba(120,200,255,0.8)','rgba(255,180,80,0.8)','rgba(255,60,60,0.9)'][i]
                    : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
            <span style={{ fontSize: '0.5rem', letterSpacing: '0.12em', color: 'rgba(200,160,255,0.4)', marginLeft: '4px' }}>
              MARS {marsStage}/3
            </span>
          </div>
        </div>

        <div style={{ width: '1px', height: '80px', background: 'rgba(200,160,255,0.1)' }} />

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1, overflowX: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '55px' }}>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '48px' }}>
              {Array.from({ length: 8 }, (_, i) => (
                <motion.div key={i}
                  animate={{ height: `${10 + Math.random() * 30}px` }}
                  transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, repeatType: 'reverse' }}
                  style={{ width: '5px', borderRadius: '2px', background: `rgba(${signalPulse ? '100,255,180' : '120,120,255'},0.7)` }}
                />
              ))}
            </div>
            <span style={{ fontSize: '0.4rem', letterSpacing: '0.1em', color: 'rgba(200,160,255,0.35)' }}>SIGNAL</span>
          </div>

          {/* CHANGED: distance display uses stage-aware label */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '85px' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 200, fontFamily: 'monospace', color: 'rgba(255,120,80,0.85)' }}>
              {['54.6M', '28.4M', '8.2M', '0.0'][marsStage]}<span style={{ fontSize: '0.5rem' }}> KM</span>
            </div>
            <span style={{ fontSize: '0.4rem', letterSpacing: '0.1em', color: 'rgba(200,160,255,0.35)' }}>DIST TO MARS</span>
            <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
              <motion.div animate={{ width: `${[5,33,66,100][marsStage]}%` }} transition={{ duration: 1 }}
                style={{ height: '100%', borderRadius: '2px', background: 'rgba(255,120,80,0.7)' }} />
            </div>
          </div>

          <div style={{ width: '1px', height: '60px', background: 'rgba(200,160,255,0.08)' }} />

          {[
            { label: 'CONSOLE', path: '/console', color: 'rgba(120,120,255,0.8)' },
            { label: 'ROOMS', path: '/rooms', color: 'rgba(200,160,255,0.8)' },
            { label: 'GAMES', path: '/games', color: 'rgba(100,255,180,0.8)' },
            { label: 'PROFILE', path: '/profile', color: 'rgba(255,180,80,0.8)' },
          ].map(btn => (
            <motion.button key={btn.label}
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              onClick={() => { sound.click(); navigate(btn.path) }}
              style={{
                padding: '9px 16px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(200,180,255,0.15)',
                color: btn.color, fontSize: '0.55rem', letterSpacing: '0.14em',
                cursor: 'pointer', minWidth: '68px',
              }}
            >{btn.label}</motion.button>
          ))}

          <div style={{ width: '1px', height: '60px', background: 'rgba(200,160,255,0.08)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '0.4rem', letterSpacing: '0.1em', color: 'rgba(200,160,255,0.25)', textAlign: 'center' }}>THRUSTERS</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['L','R'].map(s => (
                <motion.button key={s} whileTap={{ scale: 0.88 }}
                  onMouseDown={() => sound.warpIn()}
                  style={{
                    width: '34px', height: '34px', borderRadius: '6px',
                    background: 'rgba(255,140,60,0.07)', border: '1px solid rgba(255,140,60,0.2)',
                    color: 'rgba(255,140,60,0.55)', fontSize: '0.55rem', cursor: 'pointer',
                  }}
                >{s}</motion.button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ width: '1px', height: '80px', background: 'rgba(200,160,255,0.1)' }} />
        <div style={{ minWidth: '90px', textAlign: 'right' }}>
          <p style={{ margin: '0 0 4px', fontSize: '0.4rem', letterSpacing: '0.12em', color: 'rgba(200,160,255,0.25)' }}>MISSION LOG</p>
          <p style={{ margin: '0 0 2px', fontSize: '0.55rem', color: 'rgba(200,160,255,0.5)', letterSpacing: '0.05em' }}>{messages.length} transmissions</p>
          <p style={{ margin: 0, fontSize: '0.5rem', color: 'rgba(200,160,255,0.3)', letterSpacing: '0.05em' }}>{user ? user.username : 'ANONYMOUS'}</p>
        </div>
      </div>

      <div style={{
        position: 'absolute', top: 0, left: '72px', right: 0, height: '2px',
        background: 'linear-gradient(90deg, rgba(200,180,255,0.4), rgba(200,180,255,0.1), rgba(200,180,255,0.4))',
        zIndex: 60,
      }} />

      <AnimatePresence>
        {showConstellation && (
          <ConstellationMap messages={messages} onClose={() => setShowConstellation(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}