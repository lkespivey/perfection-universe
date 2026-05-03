import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

export default function Home() {
  const [data, setData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    client.get('/home/').then(res => setData(res.data))
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 20px' }}>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2 }}
        style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 300, letterSpacing: '0.1em' }}
      >
        THE IN-BETWEEN
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1.2 }}
        style={{ marginTop: '1.5rem', maxWidth: '480px', color: 'rgba(200,160,255,0.85)', lineHeight: 1.7 }}
      >
        {data?.tagline || 'A space where memories drift, signals echo, and songs become places.'}
      </motion.p>

      <div style={{ display: 'flex', gap: '16px', marginTop: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/console')}>
          ACCESS SHIP CONSOLE
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/rooms')}>
          LIMINAL ROOMS
        </motion.button>
      </div>

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 8 }}
        className="planet"
        style={{ marginTop: '60px' }}
      />
    </div>
  )
}