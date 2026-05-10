import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'
import { sound } from '../utils/sound'

// Map room slugs to their dedicated pages
const ROOM_PAGES = {
  'echo-room': '/rooms/echo-room',
}

export default function Rooms() {
  const [rooms, setRooms] = useState([])
  const [active, setActive] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    client.get('/rooms/')
      .then(res => { setRooms(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  return (
    <div style={{
      minHeight: '100vh', color: 'white',
      background: 'linear-gradient(160deg, #0d001a, #1e003a, #2a003f)',
      paddingBottom: '80px',
    }}>
      <div style={{
        padding: '28px 40px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '0.65rem', letterSpacing: '0.25em', color: 'rgba(200,160,255,0.5)' }}>
            PERFECTION UNIVERSE
          </p>
          <h1 style={{ margin: 0, fontWeight: 300, fontSize: '1.4rem', letterSpacing: '0.2em' }}>
            THE LIMINAL ROOMS
          </h1>
        </div>
        <button onClick={() => { sound.click(); navigate('/') }}
          style={{ fontSize: '0.7rem', letterSpacing: '0.15em', padding: '8px 18px' }}>
          ← BACK
        </button>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 20px' }}>
        {loading && (
          <motion.p animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}
            style={{ textAlign: 'center', color: 'rgba(200,160,255,0.5)', letterSpacing: '0.15em', fontSize: '0.8rem' }}>
            OPENING THE ROOMS...
          </motion.p>
        )}
        {!loading && rooms.length === 0 && (
          <p style={{ textAlign: 'center', color: 'rgba(200,160,255,0.4)', letterSpacing: '0.1em' }}>
            The rooms are being prepared. Check back soon.
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          {rooms.map((room, i) => {
            const isLast = i === rooms.length - 1
            const hasPage = !!ROOM_PAGES[room.slug]

            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12, duration: 0.7 }}
                whileHover={{ y: -6, scale: 1.02 }}
                onHoverStart={() => sound.hover()}
                onClick={() => {
                  sound.click()
                  if (hasPage) {
                    navigate(ROOM_PAGES[room.slug])
                  } else {
                    setActive(active?.id === room.id ? null : room)
                  }
                }}
                style={{
                  borderRadius: '20px', padding: '32px 28px', cursor: 'pointer',
                  transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden',
                  border: active?.id === room.id
                    ? `1px solid ${room.ambient_color}55`
                    : '1px solid rgba(255,255,255,0.1)',
                  background: active?.id === room.id
                    ? `radial-gradient(circle at top left, ${room.ambient_color}22, rgba(255,255,255,0.06))`
                    : 'rgba(255,255,255,0.06)',
                  boxShadow: active?.id === room.id ? `0 0 40px ${room.ambient_color}22` : 'none',
                }}
              >
                {/* Scar on last room */}
                {isLast && (
                  <svg style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    pointerEvents: 'none', opacity: 0.15,
                  }}>
                    <motion.path
                      d="M 20 80 Q 80 40 140 90 Q 200 140 260 60"
                      stroke="rgba(255,80,80,0.8)" strokeWidth="1.5" fill="none"
                      animate={{ opacity: [0.1, 0.4, 0.1] }}
                      transition={{ repeat: Infinity, duration: 4 }} />
                  </svg>
                )}

                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: room.ambient_color, marginBottom: '20px',
                  boxShadow: `0 0 12px ${room.ambient_color}`,
                }} />

                <h3 style={{ margin: '0 0 12px', fontWeight: 400, fontSize: '1.15rem', letterSpacing: '0.08em' }}>
                  {room.name}
                  {isLast && <span style={{ marginLeft: '8px', fontSize: '0.6rem', color: 'rgba(255,80,80,0.6)' }}>⸻</span>}
                </h3>

                <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: 'rgba(220,200,255,0.7)', lineHeight: 1.75 }}>
                  {room.description}
                </p>

                {hasPage ? (
                  <div style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: 'rgba(200,160,255,0.6)' }}>
                    ENTER ROOM →
                  </div>
                ) : (
                  <AnimatePresence>
                    {active?.id === room.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ paddingTop: '20px', borderTop: `1px solid ${room.ambient_color}33` }}>
                          {room.unlock_requirement ? (
                            <p style={{ margin: 0, fontSize: '0.75rem', letterSpacing: '0.12em', color: 'rgba(255,180,100,0.7)' }}>
                              ⬡ REQUIRES: {room.unlock_requirement}
                            </p>
                          ) : (
                            <p style={{ margin: 0, fontSize: '0.75rem', letterSpacing: '0.12em', color: 'rgba(100,255,180,0.7)' }}>
                              ⬡ OPEN — ENTER FREELY
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}