import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import client from '../api/client'

export default function Rooms() {
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    client.get('/rooms/').then(res => setRooms(res.data))
  }, [])

  return (
    <div style={{ minHeight: '100vh', padding: '60px 20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontWeight: 300, letterSpacing: '0.2em' }}>LIMINAL ROOMS</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginTop: '40px' }}>
        {rooms.map((room, i) => (
          <motion.div key={room.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }} className="card" style={{ maxWidth: '100%' }}>
            <h3 style={{ margin: '0 0 8px', fontWeight: 400 }}>{room.name}</h3>
            <p style={{ margin: 0, color: 'rgba(220,200,255,0.8)', fontSize: '0.9rem' }}>{room.description}</p>
          </motion.div>
        ))}
        {rooms.length === 0 && <p style={{ color: 'rgba(200,160,255,0.6)' }}>Rooms are being prepared...</p>}
      </div>
    </div>
  )
}