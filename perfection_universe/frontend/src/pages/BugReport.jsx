import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { sound } from '../utils/sound'
import client from '../api/client'

const CATEGORIES = [
  'Navigation / links not working',
  'Map nodes not clickable',
  'Signal chat not responding',
  'Rooms not loading or navigating',
  'Games — crash or error',
  'Account / login issues',
  'Audio not playing',
  'Visual glitch or layout broken',
  'Something feels wrong but I am not sure if it is a bug',
  'Other',
]

const SEVERITY = [
  { value: 'low', label: 'LOW — Minor issue, does not break anything' },
  { value: 'medium', label: 'MEDIUM — Something is wrong but I can work around it' },
  { value: 'high', label: 'HIGH — Something is completely broken' },
]

export default function BugReport() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [form, setForm] = useState({
    name: user?.username || '',
    email: user?.email || '',
    category: '',
    severity: 'medium',
    description: '',
    steps: '',
    page: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.category) { setError('Please select a category.'); return }
    if (!form.description.trim()) { setError('Please describe the bug.'); return }
    setError('')
    setSubmitting(true)

    try {
      await client.post('/bugs/', form)
      sound.unlock()
      setSubmitted(true)
    } catch (err) {
      setError('Something went wrong submitting the report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: 'white', fontSize: '0.88rem',
    outline: 'none', fontFamily: 'inherit',
    letterSpacing: '0.03em',
    transition: 'border-color 0.2s ease',
  }

  const labelStyle = {
    fontSize: '0.6rem', letterSpacing: '0.2em',
    color: 'rgba(200,160,255,0.5)',
    display: 'block', marginBottom: '8px',
  }

  if (submitted) return (
    <div style={{
      minHeight: '100vh', color: 'white',
      background: 'linear-gradient(160deg, #08050e, #0e0818, #120a1a)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        style={{ textAlign: 'center', maxWidth: '440px' }}
      >
        <motion.div
          animate={{ boxShadow: ['0 0 30px rgba(100,255,180,0.3)', '0 0 60px rgba(100,255,180,0.15)', '0 0 30px rgba(100,255,180,0.3)'] }}
          transition={{ repeat: Infinity, duration: 3 }}
          style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(100,255,180,0.8), rgba(40,180,100,0.4))',
            margin: '0 auto 32px',
          }}
        />
        <p style={{ margin: '0 0 6px', fontSize: '0.6rem', letterSpacing: '0.28em', color: 'rgba(100,255,180,0.5)' }}>
          TRANSMISSION RECEIVED
        </p>
        <h2 style={{ margin: '0 0 16px', fontWeight: 300, fontSize: '1.6rem', letterSpacing: '0.15em' }}>
          REPORT SUBMITTED
        </h2>
        <p style={{ margin: '0 0 32px', fontSize: '0.84rem', color: 'rgba(200,185,170,0.5)', lineHeight: 1.85 }}>
          Thank you. The signal has logged your report.
          We will look into it as soon as possible.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => { sound.click(); navigate('/') }}
            style={{ fontSize: '0.7rem', letterSpacing: '0.15em', padding: '12px 28px' }}
          >
            RETURN HOME
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => {
              setSubmitted(false)
              setForm({ name: user?.username || '', email: '', category: '', severity: 'medium', description: '', steps: '', page: '' })
            }}
            style={{ fontSize: '0.7rem', letterSpacing: '0.15em', padding: '12px 28px' }}
          >
            REPORT ANOTHER
          </motion.button>
        </div>
      </motion.div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', color: 'white',
      background: 'linear-gradient(160deg, #08050e, #0e0818, #120a1a)',
      paddingBottom: '80px',
    }}>
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '28px 40px',
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '0.58rem', letterSpacing: '0.28em', color: 'rgba(200,160,255,0.35)' }}>
            PERFECTION UNIVERSE
          </p>
          <h1 style={{ margin: '0 0 6px', fontWeight: 300, fontSize: '1.6rem', letterSpacing: '0.2em' }}>
            BUG REPORT
          </h1>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(200,160,255,0.35)', letterSpacing: '0.08em' }}>
            Found something broken? Tell us what happened.{' '}
            <Link to="/faq" style={{ color: 'rgba(200,160,255,0.55)', textDecoration: 'none' }}>
              Check the FAQ first →
            </Link>
          </p>
        </div>
        <button
          onClick={() => { sound.click(); navigate('/') }}
          style={{ fontSize: '0.65rem', letterSpacing: '0.15em', padding: '8px 18px' }}
        >
          ← BACK
        </button>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>YOUR NAME / USERNAME</label>
              <input type="text" placeholder="Optional" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(200,160,255,0.3)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
            <div>
              <label style={labelStyle}>EMAIL <span style={{ color: 'rgba(200,160,255,0.3)', fontSize: '0.5rem' }}>(for follow-up)</span></label>
              <input type="email" placeholder="Optional" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(200,160,255,0.3)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>CATEGORY <span style={{ color: 'rgba(255,120,80,0.6)' }}>*</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CATEGORIES.map(cat => (
                <motion.button key={cat} type="button"
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { sound.click(); setForm({ ...form, category: cat }) }}
                  style={{
                    padding: '7px 14px', borderRadius: '999px',
                    fontSize: '0.65rem', letterSpacing: '0.08em',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    border: `1px solid ${form.category === cat ? 'rgba(200,160,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    background: form.category === cat ? 'rgba(200,160,255,0.12)' : 'rgba(255,255,255,0.03)',
                    color: form.category === cat ? 'rgba(220,200,255,0.95)' : 'rgba(200,180,255,0.5)',
                  }}
                >{cat}</motion.button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>SEVERITY</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {SEVERITY.map(sev => (
                <motion.div key={sev.value} whileHover={{ x: 3 }}
                  onClick={() => { sound.click(); setForm({ ...form, severity: sev.value }) }}
                  style={{
                    padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: `1px solid ${form.severity === sev.value ? 'rgba(200,160,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    background: form.severity === sev.value ? 'rgba(200,160,255,0.07)' : 'rgba(255,255,255,0.02)',
                    display: 'flex', alignItems: 'center', gap: '12px',
                  }}
                >
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                    background: sev.value === 'low' ? 'rgba(100,255,180,0.7)' : sev.value === 'medium' ? 'rgba(255,180,80,0.7)' : 'rgba(255,80,80,0.8)',
                    boxShadow: form.severity === sev.value
                      ? `0 0 8px ${sev.value === 'low' ? 'rgba(100,255,180,0.5)' : sev.value === 'medium' ? 'rgba(255,180,80,0.5)' : 'rgba(255,80,80,0.5)'}`
                      : 'none',
                  }} />
                  <span style={{ fontSize: '0.75rem', color: form.severity === sev.value ? 'rgba(220,200,255,0.85)' : 'rgba(200,180,255,0.45)', letterSpacing: '0.05em' }}>
                    {sev.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>PAGE OR URL WHERE IT HAPPENED</label>
            <input type="text" placeholder="e.g. /map, /rooms/echo-room, /console"
              value={form.page} onChange={e => setForm({ ...form, page: e.target.value })}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(200,160,255,0.3)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
          </div>

          <div>
            <label style={labelStyle}>WHAT HAPPENED? <span style={{ color: 'rgba(255,120,80,0.6)' }}>*</span></label>
            <textarea placeholder="Describe what went wrong. What did you expect to happen?"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={5} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.75 }}
              onFocus={e => e.target.style.borderColor = 'rgba(200,160,255,0.3)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
          </div>

          <div>
            <label style={labelStyle}>STEPS TO REPRODUCE <span style={{ color: 'rgba(200,160,255,0.3)', fontSize: '0.5rem' }}>(optional but helpful)</span></label>
            <textarea placeholder={'1. Go to...\n2. Click on...\n3. See error'}
              value={form.steps} onChange={e => setForm({ ...form, steps: e.target.value })}
              rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.75 }}
              onFocus={e => e.target.style.borderColor = 'rgba(200,160,255,0.3)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  margin: 0, padding: '12px 16px', borderRadius: '10px',
                  background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)',
                  color: 'rgba(255,130,130,0.9)', fontSize: '0.82rem', letterSpacing: '0.04em',
                }}
              >{error}</motion.p>
            )}
          </AnimatePresence>

          <motion.button type="submit" disabled={submitting}
            whileHover={{ scale: submitting ? 1 : 1.02 }}
            whileTap={{ scale: submitting ? 1 : 0.98 }}
            style={{ padding: '14px', fontSize: '0.75rem', letterSpacing: '0.2em', opacity: submitting ? 0.5 : 1 }}
          >
            {submitting ? 'TRANSMITTING...' : 'SUBMIT REPORT'}
          </motion.button>

          <p style={{ margin: 0, textAlign: 'center', fontSize: '0.68rem', color: 'rgba(200,160,255,0.25)', lineHeight: 1.7 }}>
            Reports are reviewed personally. Thank you for taking the time.
          </p>
        </form>
      </div>
    </div>
  )
}