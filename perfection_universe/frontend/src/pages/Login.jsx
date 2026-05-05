import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import client from '../api/client'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await client.post('/accounts/register/', form)
      navigate('/login')
    } catch (err) {
      const data = err.response?.data
      const msg = data?.username?.[0] || data?.password?.[0] || data?.email?.[0] || 'Registration failed.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.06)',
    color: 'white', fontSize: '0.95rem',
    outline: 'none', transition: 'border 0.2s ease',
    fontFamily: 'inherit',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '20px',
      background: 'linear-gradient(135deg, #0a0015, #1a0030, #2a003f)',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          width: '100%', maxWidth: '380px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '20px', padding: '44px 36px',
        }}
      >
        <p style={{ margin: '0 0 4px', fontSize: '0.6rem', letterSpacing: '0.25em', color: 'rgba(200,160,255,0.5)' }}>
          PERFECTION UNIVERSE
        </p>
        <h1 style={{ margin: '0 0 8px', fontWeight: 300, fontSize: '1.6rem', letterSpacing: '0.15em' }}>
          JOIN THE UNIVERSE
        </h1>
        <p style={{ margin: '0 0 32px', fontSize: '0.82rem', color: 'rgba(200,160,255,0.5)', lineHeight: 1.6 }}>
          Create your account to track signal logs and unlock liminal rooms.
        </p>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ color: 'rgba(255,120,140,0.9)', fontSize: '0.82rem', marginBottom: '16px' }}
          >
            {error}
          </motion.p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            type="text" placeholder="Username"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            style={inputStyle} required
          />
          <input
            type="email" placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={inputStyle} required
          />
          <input
            type="password" placeholder="Password (min. 8 characters)"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            style={inputStyle} required minLength={8}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: '8px', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '0.82rem', color: 'rgba(200,160,255,0.5)', textAlign: 'center' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'rgba(200,160,255,0.9)', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}