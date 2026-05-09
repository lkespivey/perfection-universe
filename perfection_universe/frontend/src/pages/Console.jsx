import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'
import { sound } from '../utils/sound'

const TYPE_COLORS = {
  transmission: 'rgba(120,200,255,0.85)',
  memory: 'rgba(200,160,255,0.85)',
  system: 'rgba(100,255,180,0.85)',
  anomaly: 'rgba(255,120,140,0.85)',
}
const TYPE_BORDERS = {
  transmission: 'rgba(120,200,255,0.25)',
  memory: 'rgba(200,160,255,0.25)',
  system: 'rgba(100,255,180,0.25)',
  anomaly: 'rgba(255,120,140,0.25)',
}

function useTypewriter(text, speed = 28, onTick) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    setDisplayed(''); setDone(false)
    if (!text) return
    let i = 0
    const iv = setInterval(() => {
      setDisplayed(text.slice(0, i + 1))
      i++
      if (i % 4 === 0 && onTick) onTick()
      if (i >= text.length) { clearInterval(iv); setDone(true) }
    }, speed)
    return () => clearInterval(iv)
  }, [text, speed])
  return { displayed, done }
}

function SignalMessage({ msg }) {
  const isSignal = msg.sender === 'signal'
  const { displayed, done } = useTypewriter(
    isSignal ? msg.text : null, 30,
    isSignal ? () => sound.tick() : null
  )
  const color = msg.type === 'unlock' ? 'rgba(255,120,140,0.9)'
    : msg.type === 'fallback' ? 'rgba(200,160,255,0.5)'
    : 'rgba(200,160,255,0.85)'

  useEffect(() => {
    if (done && isSignal) sound.receive()
  }, [done])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: isSignal ? 'flex-start' : 'flex-end',
      marginBottom: '16px',
    }}>
      <p style={{ margin: '0 0 4px', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)' }}>
        {isSignal ? 'SIGNAL' : 'YOU'}
      </p>
      <div style={{
        maxWidth: '80%', padding: '12px 16px',
        borderRadius: isSignal ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
        background: isSignal ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)',
        border: `1px solid ${isSignal ? 'rgba(200,160,255,0.15)' : 'rgba(255,255,255,0.1)'}`,
        fontSize: '0.88rem', lineHeight: 1.8, letterSpacing: '0.04em',
        color: isSignal ? color : 'rgba(255,255,255,0.8)',
        fontFamily: isSignal ? 'monospace' : 'inherit',
      }}>
        {isSignal ? (
          <>
            {displayed}
            {!done && (
              <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>▌</motion.span>
            )}
          </>
        ) : msg.text}
      </div>
    </div>
  )
}

function MarsIndicator({ stage }) {
  const labels = ['SIGNAL DORMANT', 'SIGNAL PRESENT', 'BROKEN RADARS', 'MARS REACHED']
  const colors = [
    'rgba(200,160,255,0.4)',
    'rgba(120,200,255,0.7)',
    'rgba(255,180,80,0.7)',
    'rgba(255,60,60,0.9)',
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '5px' }}>
        {[0, 1, 2, 3].map(i => (
          <motion.div key={i}
            animate={i <= stage ? { opacity: 1 } : { opacity: 0.15 }}
            style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: i <= stage ? colors[stage] : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: '0.58rem', letterSpacing: '0.18em', color: colors[stage] }}>
        {labels[stage]}
      </span>
    </div>
  )
}

export default function Console() {
  const [signals, setSignals] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [consoleOpen, setConsoleOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [unlockedRoom, setUnlockedRoom] = useState(null)
  const [marsStage, setMarsStage] = useState(0)
  const [signalActive, setSignalActive] = useState(false)
  const [glidingText, setGlidingText] = useState(false)
  const [idleMessage, setIdleMessage] = useState(false)
  const chatEndRef = useRef(null)
  const idleTimerRef = useRef(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    client.get('/console/signals/')
      .then(res => { setSignals(res.data); setLoading(false) })
      .catch(() => setLoading(false))
    if (user) {
      client.get('/accounts/me/')
        .then(res => setMarsStage(res.data.profile?.mars_stage ?? 0))
    }
    const iv = setInterval(() => setSignalActive(prev => !prev), 15000)

    // 3 minute idle message
    idleTimerRef.current = setTimeout(() => {
      setIdleMessage(true)
      setTimeout(() => setIdleMessage(false), 10000)
    }, 180000)

    return () => {
      clearInterval(iv)
      clearTimeout(idleTimerRef.current)
    }
  }, [user])

  // Reset idle timer on any interaction
  useEffect(() => {
    const reset = () => {
      clearTimeout(idleTimerRef.current)
      setIdleMessage(false)
      idleTimerRef.current = setTimeout(() => {
        setIdleMessage(true)
        setTimeout(() => setIdleMessage(false), 10000)
      }, 180000)
    }
    window.addEventListener('mousemove', reset)
    window.addEventListener('keydown', reset)
    return () => {
      window.removeEventListener('mousemove', reset)
      window.removeEventListener('keydown', reset)
    }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const openConsole = () => {
    sound.pageWhoosh()
    setConsoleOpen(true)
    if (chatMessages.length === 0) {
      setChatMessages([{
        id: Date.now(), sender: 'signal', type: 'system',
        text: 'SIGNAL ACTIVE. TRANSMISSION OPEN. SPEAK AND I WILL HEAR YOU.',
      }])
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    sound.transmit()
    const userMsg = { id: Date.now(), sender: 'user', text: input }
    setChatMessages(prev => [...prev, userMsg])
    const sentText = input

    // Easter egg — "cosmic scars" typed
    if (sentText.toLowerCase().includes('cosmic scars')) {
      sound.cosmicScars()
    }

    // Easter egg — glitchy text at Mars Stage 2
    if (marsStage >= 2) {
      const glitched = sentText.split('').map(c =>
        Math.random() < 0.15 ? String.fromCharCode(c.charCodeAt(0) + Math.floor(Math.random() * 3 - 1)) : c
      ).join('')
      if (glitched !== sentText) {
        setChatMessages(prev => prev.map(m =>
          m.id === userMsg.id ? { ...m, text: glitched } : m
        ))
      }
    }

    setInput('')
    setSending(true)
    await new Promise(r => setTimeout(r, 900))

    try {
      const res = await client.post('/console/speak/', { message: sentText })
      const newStage = res.data.mars_stage ?? marsStage
      setMarsStage(newStage)
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1, sender: 'signal',
        text: res.data.text, type: res.data.type,
      }])
      if (res.data.type === 'unlock' && res.data.room_slug) {
        setUnlockedRoom(res.data.room_slug)
        sound.unlock()
      }
      if (res.data.false_ending) {
        setTimeout(() => navigate('/arrival'), 6000)
      }
    } catch {
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1, sender: 'signal', type: 'fallback',
        text: '...SIGNAL LOST.',
      }])
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // "id still be on mars" — profile stat hint
  const noVoiceHint = marsStage >= 2

  return (
    <div style={{
      minHeight: '100vh', color: 'white',
      background: marsStage >= 3
        ? 'linear-gradient(135deg, #1a0000, #0a0000)'
        : 'linear-gradient(135deg, #0a0015, #1a0030, #2a003f)',
      paddingBottom: '80px',
      transition: 'background 2s ease',
    }}>

      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '28px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '0.65rem', letterSpacing: '0.25em', color: 'rgba(200,160,255,0.5)' }}>
            PERFECTION UNIVERSE · VESSEL I
          </p>
          <h1 style={{ margin: 0, fontWeight: 300, fontSize: '1.4rem', letterSpacing: '0.2em' }}>
            COSMIC SCARS — SHIP CONSOLE
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <MarsIndicator stage={marsStage} />
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={openConsole}
            style={{
              fontSize: '0.68rem', letterSpacing: '0.15em', padding: '8px 18px',
              borderColor: consoleOpen ? 'rgba(200,160,255,0.5)' : undefined,
              background: consoleOpen ? 'rgba(200,160,255,0.1)' : undefined,
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            <motion.div
              animate={{ opacity: signalActive ? [0.4, 1, 0.4] : 0.2 }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ width: '7px', height: '7px', borderRadius: '50%', background: signalActive ? 'rgba(100,255,180,0.9)' : 'rgba(255,255,255,0.3)' }}
            />
            {consoleOpen ? 'CONSOLE OPEN' : 'OPEN SIGNAL'}
          </motion.button>
          <button onClick={() => { sound.click(); navigate('/') }} style={{ fontSize: '0.7rem', letterSpacing: '0.15em', padding: '8px 18px' }}>
            ← BACK
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        display: 'flex', gap: '32px', padding: '16px 40px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        fontSize: '0.65rem', letterSpacing: '0.15em',
        color: 'rgba(200,160,255,0.45)', flexWrap: 'wrap',
      }}>
        <span>DESTINATION: {marsStage >= 3 ? '???' : 'MARS'}</span>
        <span>SIGNAL: {marsStage >= 2 ? 'BROKEN RADARS' : signals.length > 0 ? 'RECEIVING' : 'SCANNING'}</span>
        <span>LOGS: {signals.length}</span>
        {user && <span>OPERATOR: {user.username.toUpperCase()}</span>}
        {noVoiceHint && <span style={{ color: 'rgba(255,180,80,0.5)' }}>I CANT HEAR YOU OVER ALL THIS NOISE</span>}
      </div>

      {/* Idle message easter egg */}
      <AnimatePresence>
        {idleMessage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            style={{
              position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
              fontSize: '0.75rem', letterSpacing: '0.15em', fontFamily: 'monospace',
              color: 'rgba(200,160,255,0.4)', pointerEvents: 'none', zIndex: 50,
              textAlign: 'center',
            }}
          >
            ...sitting in peace. lonely. watching the stars.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Room unlock notification */}
      <AnimatePresence>
        {unlockedRoom && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{
              margin: '20px 40px 0', padding: '16px 24px', borderRadius: '12px',
              background: 'rgba(255,40,80,0.12)', border: '1px solid rgba(255,40,80,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.8rem', letterSpacing: '0.12em', color: 'rgba(255,120,140,0.9)' }}>
              ⬡ NEW ROOM UNLOCKED
            </p>
            <button onClick={() => { sound.click(); navigate('/rooms') }} style={{ fontSize: '0.68rem', letterSpacing: '0.12em', padding: '6px 14px' }}>
              ENTER THE ROOMS →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signal chat */}
      <AnimatePresence>
        {consoleOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}
          >
            <div style={{
              margin: '24px 40px', borderRadius: '16px',
              border: `1px solid ${marsStage >= 3 ? 'rgba(255,60,60,0.3)' : 'rgba(200,160,255,0.15)'}`,
              background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', overflow: 'hidden',
              transition: 'border-color 1s ease',
            }}>
              <div style={{
                padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: marsStage >= 2 ? 0.6 : 2 }}
                    style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: marsStage >= 3 ? 'rgba(255,60,60,0.9)'
                        : marsStage >= 2 ? 'rgba(255,180,80,0.8)'
                        : 'rgba(100,255,180,0.8)',
                    }}
                  />
                  <span style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: 'rgba(200,160,255,0.6)' }}>
                    {marsStage >= 3 ? 'SIGNAL COMPROMISED'
                      : marsStage >= 2 ? 'TRAPPED BY CHOICE. DONT HAVE A VOICE.'
                      : 'SIGNAL OPEN · SPEAK FREELY'}
                  </span>
                </div>
                <button onClick={() => setConsoleOpen(false)} style={{ fontSize: '0.6rem', padding: '4px 10px', letterSpacing: '0.1em' }}>
                  CLOSE
                </button>
              </div>

              <div style={{ height: '320px', overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                {chatMessages.map(msg => <SignalMessage key={msg.id} msg={msg} />)}
                {sending && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '0.55rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)' }}>SIGNAL</span>
                    {[0, 1, 2].map(i => (
                      <motion.div key={i}
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                        style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(200,160,255,0.6)' }}
                      />
                    ))}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '10px' }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={marsStage >= 3 ? 'THE SIGNAL MAY NOT RESPOND...' : 'SPEAK TO THE SIGNAL...'}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white', fontSize: '0.85rem',
                    fontFamily: 'monospace', letterSpacing: '0.05em', outline: 'none',
                  }}
                  disabled={sending}
                />
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={sendMessage}
                  disabled={sending || !input.trim()}
                  style={{ padding: '10px 18px', fontSize: '0.7rem', letterSpacing: '0.12em', opacity: sending || !input.trim() ? 0.4 : 1 }}
                >
                  TRANSMIT
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signal logs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selected ? '1fr 1fr' : '1fr',
        maxWidth: '1100px', margin: '0 auto', padding: '40px 20px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading && (
            <motion.p animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}
              style={{ color: 'rgba(200,160,255,0.5)', letterSpacing: '0.15em', fontSize: '0.8rem' }}>
              SCANNING FOR TRANSMISSIONS...
            </motion.p>
          )}
          {!loading && signals.length === 0 && (
            <p style={{ color: 'rgba(200,160,255,0.4)', fontSize: '0.85rem', letterSpacing: '0.1em' }}>
              NO TRANSMISSIONS RECEIVED.
            </p>
          )}
          {signals.map((s, i) => (
            <motion.div key={s.id}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
              whileHover={{ x: 4 }}
              onClick={() => { sound.click(); setSelected(selected?.id === s.id ? null : s) }}
              style={{
                padding: '20px 24px', borderRadius: '12px',
                border: `1px solid ${selected?.id === s.id ? TYPE_BORDERS[s.signal_type] : 'rgba(255,255,255,0.08)'}`,
                background: selected?.id === s.id ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: '0.6rem', letterSpacing: '0.2em', color: TYPE_COLORS[s.signal_type] || 'rgba(200,160,255,0.6)' }}>
                    [{s.signal_type.toUpperCase()}]{s.stardate ? ` · ${s.stardate}` : ''}
                  </p>
                  <h3 style={{ margin: 0, fontWeight: 400, fontSize: '1rem', letterSpacing: '0.05em' }}>{s.title}</h3>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', flexShrink: 0 }}>
                  {selected?.id === s.id ? '▼' : '▶'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div key={selected.id}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              style={{
                padding: '28px 32px', marginLeft: '20px', borderRadius: '16px',
                border: `1px solid ${TYPE_BORDERS[selected.signal_type]}`,
                background: 'rgba(255,255,255,0.04)', alignSelf: 'flex-start', position: 'sticky', top: '20px',
              }}
            >
              <p style={{ margin: '0 0 8px', fontSize: '0.6rem', letterSpacing: '0.25em', color: TYPE_COLORS[selected.signal_type] }}>
                [{selected.signal_type.toUpperCase()}]{selected.stardate ? ` · ${selected.stardate}` : ''}
              </p>
              <h2 style={{ margin: '0 0 20px', fontWeight: 300, fontSize: '1.4rem', letterSpacing: '0.08em' }}>{selected.title}</h2>
              <p style={{ margin: 0, lineHeight: 1.9, fontSize: '0.95rem', color: 'rgba(220,200,255,0.85)', whiteSpace: 'pre-wrap' }}>
                {selected.content}
              </p>
              <button onClick={() => setSelected(null)} style={{ marginTop: '28px', fontSize: '0.7rem', letterSpacing: '0.15em', padding: '8px 18px' }}>
                CLOSE
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer
        onClick={openConsole}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          textAlign: 'center', padding: '14px 20px',
          fontSize: '0.7rem', letterSpacing: '0.18em', cursor: 'pointer',
          background: 'rgba(10,0,20,0.7)', backdropFilter: 'blur(8px)',
          borderTop: `1px solid ${signalActive ? 'rgba(200,160,255,0.2)' : 'rgba(255,255,255,0.04)'}`,
          color: signalActive ? 'rgba(200,160,255,0.9)' : 'rgba(200,160,255,0.3)',
          transition: 'all 0.5s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <motion.div
            animate={{ opacity: signalActive ? [0.4, 1, 0.4] : 0.2 }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ width: '6px', height: '6px', borderRadius: '50%', background: signalActive ? 'rgba(100,255,180,0.9)' : 'rgba(255,255,255,0.3)' }}
          />
          {signalActive ? 'SIGNAL ACTIVE · CLICK TO TRANSMIT' : 'SIGNAL DORMANT · SEARCHING FOR CONNECTION'}
        </div>
      </footer>
    </div>
  )
}