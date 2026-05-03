import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(form.username, form.password)
      navigate('/')
    } catch {
      setError('Invalid credentials.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="card" style={{ maxWidth: '360px', width: '100%' }}>
        <h2 style={{ marginTop: 0, fontWeight: 300, letterSpacing: '0.1em' }}>SIGN IN</h2>
        {error && <p style={{ color: '#ff8888', fontSize: '0.85rem' }}>{error}</p>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'white', fontSize: '0.95rem' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'white', fontSize: '0.95rem' }}
          />
          <button type="submit">ENTER</button>
        </form>
        <p style={{ marginTop: '16px', fontSize: '0.85rem', color: 'rgba(200,160,255,0.7)' }}>
          No account? <Link to="/register" style={{ color: 'rgba(200,160,255,1)' }}>Register</Link>
        </p>
      </div>
    </div>
  )
}