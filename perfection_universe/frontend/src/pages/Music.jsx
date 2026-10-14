import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { sound } from '../utils/sound'
import { SONGS, PLATFORMS, MUSIC_SECTION_NAME } from '../data/songs'

function Cover({ song }) {
  if (song.cover) {
    return (
      <img src={song.cover} alt={`${song.title} cover art`}
        style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: '10px', display: 'block' }} />
    )
  }
  // placeholder art until a real cover is added
  return (
    <div style={{
      width: '100%', aspectRatio: '1 / 1', borderRadius: '10px', position: 'relative', overflow: 'hidden',
      background: song.released
        ? 'radial-gradient(circle at 35% 30%, rgba(200,160,255,0.55), rgba(60,10,110,0.9) 60%, #06001a)'
        : 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05), #06001a 70%)',
      border: '1px solid rgba(200,160,255,0.15)',
    }}>
      <motion.div
        animate={{ opacity: song.released ? [0.3, 0.7, 0.3] : [0.05, 0.2, 0.05] }}
        transition={{ repeat: Infinity, duration: 3 }}
        style={{ position: 'absolute', inset: '30%', borderRadius: '50%', border: '1px solid rgba(220,190,255,0.6)' }}
      />
      <span style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem', fontWeight: 200, letterSpacing: '0.1em', color: 'rgba(240,225,255,0.8)',
      }}>
        {song.released ? song.title.charAt(0) : '?'}
      </span>
    </div>
  )
}

function SongCard({ song, number }) {
  const links = PLATFORMS.filter((p) => song[p.key])
  return (
    <div style={{
      padding: '18px', borderRadius: '14px',
      background: 'rgba(10,0,24,0.7)',
      border: `1px solid ${song.released ? 'rgba(200,160,255,0.25)' : 'rgba(200,160,255,0.1)'}`,
      opacity: song.released ? 1 : 0.65,
      display: 'flex', flexDirection: 'column', gap: '14px',
    }}>
      <Cover song={song} />
      <div>
        <p style={{ margin: '0 0 4px', fontSize: '0.5rem', letterSpacing: '0.2em', color: song.released ? 'rgba(100,255,180,0.6)' : 'rgba(255,180,80,0.6)' }}>
          MESSAGE {String(number).padStart(3, '0')} · {song.released ? 'RECEIVED' : 'INCOMING'} · {song.date}
        </p>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 300, letterSpacing: '0.14em', color: 'rgba(235,220,255,0.95)' }}>
          {song.title}
        </h2>
        <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.6, color: 'rgba(200,160,255,0.55)' }}>
          {song.blurb}
        </p>
      </div>

      {song.released && links.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 'auto' }}>
          {links.map((p) => (
            <motion.a key={p.key}
              href={song[p.key]} target="_blank" rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onMouseEnter={() => sound.hover()}
              onClick={() => sound.click()}
              style={{
                padding: '8px 12px', borderRadius: '8px', textDecoration: 'none',
                background: `rgba(${p.color},0.08)`,
                border: `1px solid rgba(${p.color},0.35)`,
                color: `rgba(${p.color},0.95)`,
                fontSize: '0.55rem', letterSpacing: '0.14em',
              }}
            >{p.label}</motion.a>
          ))}
        </div>
      )}
      {!song.released && (
        <p style={{ margin: 'auto 0 0', fontSize: '0.5rem', letterSpacing: '0.16em', color: 'rgba(200,160,255,0.35)' }}>
          SIGNAL TOO FAINT TO PLAY
        </p>
      )}
    </div>
  )
}

export default function Music() {
  return (
    <div style={{
      minHeight: '100vh', padding: '96px 32px 64px',
      background: 'radial-gradient(ellipse at 50% 0%, #1a0838 0%, #06001a 55%, #01000a 100%)',
      color: 'white', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <Link to="/map" onClick={() => sound.click()}
          style={{ fontSize: '0.55rem', letterSpacing: '0.16em', color: 'rgba(200,160,255,0.45)', textDecoration: 'none' }}>
          ← BACK TO MAP
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ margin: '28px 0 40px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '0.55rem', letterSpacing: '0.24em', color: 'rgba(200,160,255,0.4)' }}>
            PERFECTION
          </p>
          <h1 style={{ margin: '0 0 10px', fontSize: '1.8rem', fontWeight: 200, letterSpacing: '0.2em', color: 'rgba(240,225,255,0.95)' }}>
            {MUSIC_SECTION_NAME}
          </h1>
          <p style={{ margin: 0, maxWidth: '480px', fontSize: '0.85rem', lineHeight: 1.7, color: 'rgba(200,160,255,0.5)' }}>
            Every song that has reached you so far, and the ones still on their way.
          </p>
        </motion.div>

        <div style={{
          display: 'grid', gap: '20px',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        }}>
          {SONGS.map((song, i) => (
            <SongCard key={song.id} song={song} number={i + 1} />
          ))}
        </div>
      </div>
    </div>
  )
}
