import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await client.post('/accounts/register/', form)
      await login(form.username, form.password)
      navigate('/')
    } catch (err) {
      const data = err.response?.data
      const msg = data?.username?.[0] || data?.password?.[0] || data?.email?.[0] || 'Registration failed.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '14px 18px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    color: 'white',
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: 'inherit',
    letterSpacing: '0.04em',
    transition: 'border 0.2s ease',
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #0a0015, #1a0030, #2a003f)',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          padding: '52px 40px',
        }}
      >
        {/* Header */}
        <p style={{
          margin: '0 0 6px',
          fontSize: '0.6rem',
          letterSpacing: '0.28em',
          color: 'rgba(200,160,255,0.4)',
        }}>
          PERFECTION UNIVERSE
        </p>
        <h1 style={{
          margin: '0 0 6px',
          fontWeight: 300,
          fontSize: '1.8rem',
          letterSpacing: '0.12em',
          color: 'white',
        }}>
          JOIN THE UNIVERSE
        </h1>
        <p style={{
          margin: '0 0 36px',
          fontSize: '0.82rem',
          color: 'rgba(200,160,255,0.45)',
          lineHeight: 1.6,
        }}>
          Create your account to track signal logs and unlock liminal rooms.
        </p>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                margin: '0 0 20px',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(255,80,100,0.1)',
                border: '1px solid rgba(255,80,100,0.25)',
                color: 'rgba(255,120,140,0.9)',
                fontSize: '0.82rem',
                letterSpacing: '0.05em',
              }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            style={inputStyle}
            required
            autoFocus
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={inputStyle}
            required
          />
          <input
            type="password"
            placeholder="Password (min. 8 characters)"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            style={inputStyle}
            required
            minLength={8}
          />

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.97 }}
            style={{
              marginTop: '8px',
              padding: '14px',
              opacity: loading ? 0.5 : 1,
              letterSpacing: '0.18em',
              fontSize: '0.82rem',
            }}
          >
            {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
          </motion.button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '28px 0',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: 'rgba(200,160,255,0.3)' }}>
            ALREADY A TRAVELLER?
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Sign in link */}
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(200,160,255,0.8)',
              fontSize: '0.82rem',
              letterSpacing: '0.18em',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
          >
            SIGN IN INSTEAD
          </motion.div>
        </Link>

        {/* Back link */}
        <p style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '0.75rem',
        }}>
          <Link
            to="/"
            style={{ color: 'rgba(200,160,255,0.4)', textDecoration: 'none', letterSpacing: '0.1em' }}
          >
            ← RETURN TO THE UNIVERSE
          </Link>
        </p>
      </motion.div>
    </div>
  )
}