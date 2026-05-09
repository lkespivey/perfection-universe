import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const GAMES = [
  {
    id: 'asteroid_drift',
    title: 'ASTEROID DRIFT',
    desc: 'The vessel is approaching Mars. Navigate the debris field. Do not stop moving.',
    status: 'ONLINE',
    path: '/games/asteroid-drift',
    color: 'rgba(120,200,255,0.8)',
  },
  {
    id: 'echo_match',
    title: 'ECHO MATCH',
    desc: 'The signal flashes patterns from the void. Watch. Then repeat them back exactly.',
    status: 'ONLINE',
    path: '/games/echo-match',
    color: 'rgba(200,160,255,0.8)',
  },
  {
    id: 'signal_alignment',
    title: 'SIGNAL ALIGNMENT',
    desc: 'A frequency is buried in the static. Drag the dial. Find it before time runs out.',
    status: 'ONLINE',
    path: '/games/signal-alignment',
    color: 'rgba(100,255,180,0.8)',
  },
]
export default function Games() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #05000f, #0a0020, #0f0030)',
        color: 'white',
        padding: '80px 20px',
      }}
    >
      <h1
        style={{
          textAlign: 'center',
          marginBottom: '40px',
          fontWeight: 300,
          letterSpacing: '0.15em',
        }}
      >
        SIMULATIONS
      </h1>

      <div
        style={{
          display: 'grid',
          gap: '20px',
          maxWidth: '700px',
          margin: '0 auto',
        }}
      >
        {GAMES.map((game) => (
          <motion.div
            key={game.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(game.path)}
            style={{
              padding: '24px',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${game.color}`,
              cursor: 'pointer',
            }}
          >
            <p
              style={{
                color: game.color,
                fontSize: '0.7rem',
                letterSpacing: '0.2em',
                marginBottom: '8px',
              }}
            >
              {game.status}
            </p>

            <h2
              style={{
                margin: '0 0 10px',
                fontWeight: 300,
                letterSpacing: '0.1em',
              }}
            >
              {game.title}
            </h2>

            <p
              style={{
                margin: 0,
                color: 'rgba(255,255,255,0.65)',
                lineHeight: 1.7,
              }}
            >
              {game.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}