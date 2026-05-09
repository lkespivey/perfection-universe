import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sound } from '../utils/sound'

export default function RadarPage() {
  const canvasRef = useRef(null)
  const [blipVisible, setBlipVisible] = useState(false)
  const [clicked, setClicked] = useState(false)
  const [blipPos, setBlipPos] = useState({ x: 0, y: 0 })
  const angleRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width; const H = canvas.height
    const cx = W / 2; const cy = H / 2
    const R = W * 0.42
    let animId
    let blipTimer = null
    let blipAngle = Math.random() * Math.PI * 2
    let blipRadius = R * (0.3 + Math.random() * 0.5)
    let blipAlpha = 0
    let blipShowing = false

    // Schedule a blip to appear after 18 seconds
    blipTimer = setTimeout(() => {
      blipShowing = true
      const bx = cx + Math.cos(blipAngle) * blipRadius
      const by = cy + Math.sin(blipAngle) * blipRadius
      setBlipPos({ x: bx / W * 100, y: by / H * 100 })
      setBlipVisible(true)
      sound.receive()
      setTimeout(() => { blipShowing = false; setBlipVisible(false) }, 4000)
    }, 18000)

    function draw() {
      ctx.clearRect(0, 0, W, H)

      // Background
      ctx.fillStyle = '#000a02'
      ctx.fillRect(0, 0, W, H)

      // Grid circles
      for (let r = R * 0.25; r <= R; r += R * 0.25) {
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(0,255,80,0.08)'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Cross lines
      ctx.strokeStyle = 'rgba(0,255,80,0.08)'
      ctx.lineWidth = 1
      ;[-1, 1].forEach(sign => {
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + sign * R, cy); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + sign * R); ctx.stroke()
      })

      // Outer circle
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0,255,80,0.2)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Sweep
      const angle = angleRef.current
      const grad = ctx.createConicalGradient
        ? null
        : null
      // Sweep trail
      for (let i = 0; i < 60; i++) {
        const a = angle - (i * Math.PI / 80)
        const alpha = (1 - i / 60) * 0.18
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, R, a - 0.04, a + 0.01)
        ctx.fillStyle = `rgba(0,255,80,${alpha})`
        ctx.fill()
      }

      // Sweep line
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(angle) * R, cy + Math.sin(angle) * R)
      ctx.strokeStyle = 'rgba(0,255,80,0.7)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Blip
      if (blipShowing) {
        blipAlpha = Math.min(1, blipAlpha + 0.04)
        const bx = cx + Math.cos(blipAngle) * blipRadius
        const by = cy + Math.sin(blipAngle) * blipRadius
        ctx.beginPath()
        ctx.arc(bx, by, 4, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,255,80,${blipAlpha})`
        ctx.fill()
        ctx.beginPath()
        ctx.arc(bx, by, 8 + blipAlpha * 4, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(0,255,80,${blipAlpha * 0.4})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Center dot
      ctx.beginPath()
      ctx.arc(cx, cy, 3, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,255,80,0.6)'
      ctx.fill()

      angleRef.current = (angleRef.current + 0.015) % (Math.PI * 2)
      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => { cancelAnimationFrame(animId); clearTimeout(blipTimer) }
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: '#000a02',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <p style={{ margin: '0 0 32px', fontSize: '0.6rem', letterSpacing: '0.28em', color: 'rgba(0,255,80,0.3)', fontFamily: 'monospace' }}>
        BROKEN RADAR · SCANNING
      </p>

      <div style={{ position: 'relative' }}>
        <canvas ref={canvasRef} width={400} height={400}
          style={{ borderRadius: '50%', border: '1px solid rgba(0,255,80,0.15)' }} />

        {/* Clickable blip area */}
        <AnimatePresence>
          {blipVisible && !clicked && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setClicked(true); sound.cosmicScars() }}
              style={{
                position: 'absolute',
                left: `${blipPos.x}%`, top: `${blipPos.y}%`,
                transform: 'translate(-50%, -50%)',
                width: '24px', height: '24px',
                cursor: 'pointer', zIndex: 10,
              }}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {clicked && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            style={{
              marginTop: '40px', fontSize: '0.82rem',
              letterSpacing: '0.15em', color: 'rgba(0,255,80,0.7)',
              fontFamily: 'monospace', textAlign: 'center',
            }}
          >
            checking each day on broken radars.
          </motion.p>
        )}
      </AnimatePresence>

      {!clicked && (
        <p style={{ marginTop: '32px', fontSize: '0.6rem', letterSpacing: '0.15em', color: 'rgba(0,255,80,0.2)', fontFamily: 'monospace' }}>
          WAIT
        </p>
      )}
    </div>
  )
}