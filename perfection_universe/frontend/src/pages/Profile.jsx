import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'
import { sound } from '../utils/sound'

const MARS_STAGES = [
  { label: 'SIGNAL DORMANT', color: 'rgba(200,160,255,0.5)', desc: 'You would still be on mars.' },
  { label: 'SIGNAL PRESENT', color: 'rgba(120,200,255,0.8)', desc: 'The signal stirs. It is beginning to remember your voice.' },
  { label: 'SIGNAL SHIFTING', color: 'rgba(255,180,80,0.8)', desc: 'Something in the transmission has changed. Trust carefully.' },
  { label: 'MARS REACHED', color: 'rgba(255,60,60,0.9)', desc: 'now im left with nothing but cosmic scars' },
]

const LORE_FLAG_LABELS = {
  identity: { label: 'IDENTITY QUESTIONED', desc: 'You asked the signal who it is.' },
  location: { label: 'LOCATION QUERIED', desc: 'You asked where you are.' },
  truth: { label: 'TRUTH SOUGHT', desc: 'You asked about the signal\'s honesty.' },
  memory: { label: 'MEMORY ACCESSED', desc: 'You asked the signal what it remembers.' },
}

function MarsOrb({ stage }) {
  const colors = [
    'radial-gradient(circle at 40% 35%, #3a005f, #0a0015)',
    'radial-gradient(circle at 40% 35%, #1a3a6f, #0a0020)',
    'radial-gradient(circle at 40% 35%, #6f3a00, #1a0800)',
    'radial-gradient(circle at 40% 35%, #8b1a1a, #1a0000)',
  ]
  const glows = [
    'rgba(120,0,200,0.3)', 'rgba(80,140,255,0.3)',
    'rgba(255,140,40,0.3)', 'rgba(255,40,40,0.4)',
  ]
  return (
    <motion.div
      animate={{ boxShadow: [`0 0 30px ${glows[stage]}`, `0 0 60px ${glows[stage]}`, `0 0 30px ${glows[stage]}`] }}
      transition={{ repeat: Infinity, duration: 4 }}
      style={{ width: '100px', height: '100px', borderRadius: '50%', background: colors[stage], flexShrink: 0 }}
    />
  )
}

export default function Profile() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [form, setForm] = useState({ display_name: '', bio: '', avatar_url: '' })

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    setForm({
      display_name: user.profile?.display_name || '',
      bio: user.profile?.bio || '',
      avatar_url: user.profile?.avatar_url || '',
    })
  }, [user])

  const marsStage = user?.profile?.mars_stage ?? 0
  const unlockedRooms = user?.profile?.unlocked_rooms ?? []
  const loreFlags = user?.profile?.lore_flags ?? {}
  const messageCount = user?.profile?.memory_log?.length ?? 0
  const currentStage = MARS_STAGES[marsStage] ?? MARS_STAGES[0]

  const handleSave = async () => {
    setSaving(true); setSaveMsg('')
    try {
      const res = await client.patch('/accounts/profile/update/', form)
      setUser(res.data)
      setSaveMsg('PROFILE UPDATED.')
      setEditing(false)
      sound.unlock()
    } catch {
      setSaveMsg('SAVE FAILED. TRY AGAIN.')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(''), 3000)
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    color: 'white', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', letterSpacing: '0.03em',
  }

  if (!user) return null

  return (
    <div style={{
      minHeight: '100vh', color: 'white',
      background: 'linear-gradient(135deg, #0a0015, #1a0030, #2a003f)',
      paddingBottom: '80px', position: 'relative', overflow: 'hidden',
    }}>

      {/* Cosmic scars watermark at stage 3 */}
      {marsStage >= 3 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 3 }}
          style={{
            position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', pointerEvents: 'none', zIndex: 0,
          }}
        >
          <span style={{
            fontSize: 'clamp(3rem, 12vw, 8rem)', fontWeight: 700,
            letterSpacing: '0.15em', color: 'rgba(255,60,60,0.04)',
            userSelect: 'none', textAlign: 'center', lineHeight: 1.2,
          }}>
            COSMIC<br />SCARS
          </span>
        </motion.div>
      )}

      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '28px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px', position: 'relative', zIndex: 1,
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '0.6rem', letterSpacing: '0.28em', color: 'rgba(200,160,255,0.4)' }}>
            PERFECTION UNIVERSE
          </p>
          <h1 style={{ margin: 0, fontWeight: 300, fontSize: '1.4rem', letterSpacing: '0.2em' }}>
            TRAVELLER PROFILE
          </h1>
        </div>
        <button onClick={() => { sound.click(); navigate('/') }} style={{ fontSize: '0.7rem', letterSpacing: '0.15em', padding: '8px 18px' }}>
          ← BACK
        </button>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: '28px', position: 'relative', zIndex: 1 }}>

        {/* Identity card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{
            borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)', padding: '32px',
            display: 'flex', gap: '28px', alignItems: 'flex-start', flexWrap: 'wrap',
          }}
        >
          <div style={{ flexShrink: 0 }}>
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="avatar"
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(200,160,255,0.3)' }}
                onError={e => e.target.style.display = 'none'}
              />
            ) : (
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #4b0082, #16001f)',
                border: '2px solid rgba(200,160,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.6rem',
              }}>
                {(user.profile?.display_name || user.username || '?')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.6rem', letterSpacing: '0.22em', color: 'rgba(200,160,255,0.4)' }}>TRAVELLER</p>
            <h2 style={{ margin: '0 0 6px', fontWeight: 300, fontSize: '1.6rem', letterSpacing: '0.1em' }}>
              {user.profile?.display_name || user.username}
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: 'rgba(200,160,255,0.5)', letterSpacing: '0.08em' }}>
              @{user.username}
            </p>
            {user.profile?.bio && (
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(220,200,255,0.7)', lineHeight: 1.8 }}>
                {user.profile.bio}
              </p>
            )}
          </div>
          <button onClick={() => { sound.click(); setEditing(!editing) }}
            style={{ fontSize: '0.65rem', letterSpacing: '0.15em', padding: '8px 16px', flexShrink: 0 }}>
            {editing ? 'CANCEL' : 'EDIT PROFILE'}
          </button>
        </motion.div>

        {/* Edit form */}
        <AnimatePresence>
          {editing && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{
                borderRadius: '20px', border: '1px solid rgba(200,160,255,0.15)',
                background: 'rgba(255,255,255,0.04)', padding: '32px',
                display: 'flex', flexDirection: 'column', gap: '16px',
              }}>
                <p style={{ margin: '0 0 8px', fontSize: '0.62rem', letterSpacing: '0.22em', color: 'rgba(200,160,255,0.5)' }}>EDIT PROFILE</p>
                {[
                  { label: 'DISPLAY NAME', key: 'display_name', placeholder: 'How should the signal address you?', type: 'input' },
                  { label: 'BIO', key: 'bio', placeholder: 'Leave a transmission for those who find this profile...', type: 'textarea' },
                  { label: 'AVATAR URL', key: 'avatar_url', placeholder: 'https://...', type: 'input' },
                ].map(field => (
                  <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: 'rgba(200,160,255,0.5)' }}>{field.label}</label>
                    {field.type === 'textarea' ? (
                      <textarea value={form[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                        placeholder={field.placeholder} rows={4}
                        style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }} />
                    ) : (
                      <input value={form[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                        placeholder={field.placeholder} style={inputStyle} />
                    )}
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleSave} disabled={saving}
                    style={{ opacity: saving ? 0.5 : 1, fontSize: '0.72rem', letterSpacing: '0.15em', padding: '10px 24px' }}>
                    {saving ? 'SAVING...' : 'SAVE CHANGES'}
                  </motion.button>
                  {saveMsg && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ fontSize: '0.7rem', letterSpacing: '0.12em', color: 'rgba(100,255,180,0.8)' }}>
                      {saveMsg}
                    </motion.span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mars stage */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{
            borderRadius: '20px',
            border: `1px solid ${currentStage.color.replace(/[\d.]+\)$/, '0.2)')}`,
            background: 'rgba(255,255,255,0.03)', padding: '32px',
            display: 'flex', gap: '28px', alignItems: 'center', flexWrap: 'wrap',
          }}
        >
          <MarsOrb stage={marsStage} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.6rem', letterSpacing: '0.22em', color: 'rgba(200,160,255,0.4)' }}>MARS PROXIMITY</p>
            <h3 style={{ margin: '0 0 8px', fontWeight: 300, fontSize: '1.3rem', letterSpacing: '0.15em', color: currentStage.color }}>
              {currentStage.label}
            </h3>
            <p style={{
              margin: '0 0 20px', fontSize: '0.85rem', color: 'rgba(200,160,255,0.6)', lineHeight: 1.7,
              fontStyle: marsStage === 0 || marsStage === 3 ? 'italic' : 'normal',
            }}>
              {currentStage.desc}
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {MARS_STAGES.map((s, i) => (
                <motion.div key={i} animate={{ opacity: i <= marsStage ? 1 : 0.15 }}
                  style={{ width: '10px', height: '10px', borderRadius: '50%', background: i <= marsStage ? s.color : 'rgba(255,255,255,0.15)' }} />
              ))}
              <span style={{ marginLeft: '8px', fontSize: '0.65rem', letterSpacing: '0.15em', color: 'rgba(200,160,255,0.4)' }}>
                STAGE {marsStage} / 3
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          {[
            { label: 'TRANSMISSIONS', value: messageCount, sub: 'counting.' },
            { label: 'ROOMS UNLOCKED', value: unlockedRooms.length, sub: 'liminal spaces found' },
            { label: 'LORE DISCOVERED', value: Object.keys(loreFlags).filter(k => loreFlags[k]).length, sub: 'signal secrets' },
          ].map((stat, i) => (
            <div key={i} style={{
              borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)', padding: '24px 20px', textAlign: 'center',
            }}>
              <p style={{ margin: '0 0 6px', fontSize: '2rem', fontWeight: 200, color: 'rgba(200,160,255,0.9)' }}>{stat.value}</p>
              <p style={{ margin: '0 0 4px', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'rgba(200,160,255,0.7)' }}>{stat.label}</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(200,160,255,0.35)', fontStyle: stat.sub === 'counting.' ? 'italic' : 'normal' }}>
                {stat.sub}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Unlocked rooms */}
        {unlockedRooms.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', padding: '32px' }}>
            <p style={{ margin: '0 0 20px', fontSize: '0.62rem', letterSpacing: '0.22em', color: 'rgba(200,160,255,0.5)' }}>ROOMS ACCESSED</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {unlockedRooms.map((slug, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  style={{
                    padding: '14px 18px', borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', gap: '12px',
                  }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(100,255,180,0.7)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.82rem', letterSpacing: '0.1em', color: 'rgba(220,200,255,0.8)' }}>
                    {slug.replace(/-/g, ' ').toUpperCase()}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Lore flags */}
        {Object.keys(loreFlags).some(k => loreFlags[k]) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            style={{ borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', padding: '32px' }}>
            <p style={{ margin: '0 0 20px', fontSize: '0.62rem', letterSpacing: '0.22em', color: 'rgba(200,160,255,0.5)' }}>SIGNAL DISCOVERIES</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.keys(loreFlags).filter(k => loreFlags[k]).map((flag, i) => {
                const info = LORE_FLAG_LABELS[flag] || { label: flag.toUpperCase(), desc: 'A signal discovery.' }
                return (
                  <motion.div key={flag} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    style={{ padding: '16px 18px', borderRadius: '10px', border: '1px solid rgba(200,160,255,0.1)', background: 'rgba(200,160,255,0.04)' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '0.65rem', letterSpacing: '0.18em', color: 'rgba(200,160,255,0.8)' }}>
                      ⬡ {info.label}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(200,160,255,0.45)', lineHeight: 1.6 }}>{info.desc}</p>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}