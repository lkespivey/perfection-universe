import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import client from '../api/client'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await client.post('/accounts/register/', form)
      navigate('/login')
    } catch (err) {
      setError('Registration failed. Username may already exist.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="card" style={{ maxWidth: '360px', width: '100%' }}>
        <h2 style={{ marginTop: 0, fontWeight: 300, letterSpacing: '0.1em' }}>JOIN THE UNIVERSE</h2>
        {error && <p style={{ color: '#ff8888', fontSize: '0.85rem' }}>{error}</p>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input type="text" placeholder="Username" value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'white', fontSize: '0.95rem' }} />
          <input type="email" placeholder="Email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'white', fontSize: '0.95rem' }} />
          <input type="password" placeholder="Password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'white', fontSize: '0.95rem' }} />
          <button type="submit">CREATE ACCOUNT</button>
        </form>
        <p style={{ marginTop: '16px', fontSize: '0.85rem', color: 'rgba(200,160,255,0.7)' }}>
          Have an account? <Link to="/login" style={{ color: 'rgba(200,160,255,1)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}