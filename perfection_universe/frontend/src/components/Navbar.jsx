import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isMap = location.pathname === '/map'

  // Hide navbar on map page — it has its own navigation
  if (isMap) return null

  const isActive = (path) => location.pathname.startsWith(path)

  const linkStyle = (path) => ({
    color: isActive(path) ? 'rgba(200,160,255,1)' : 'rgba(200,160,255,0.5)',
    textDecoration: 'none',
    fontSize: '0.65rem',
    letterSpacing: '0.18em',
    transition: 'color 0.2s ease',
  })

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 32px',
      background: 'rgba(10,0,20,0.6)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <Link to="/" style={{ ...linkStyle('/'), fontSize: '0.7rem', fontWeight: 500 }}>
        PERFECTION UNIVERSE
      </Link>

      <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
        <Link to="/console" style={linkStyle('/console')}>CONSOLE</Link>
        <Link to="/rooms" style={linkStyle('/rooms')}>ROOMS</Link>
        <Link to="/games" style={linkStyle('/games')}>GAMES</Link>
        <Link to="/map" style={linkStyle('/map')}>MAP</Link>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link to="/profile" style={{
              fontSize: '0.65rem', letterSpacing: '0.15em',
              color: isActive('/profile') ? 'rgba(200,160,255,1)' : 'rgba(200,160,255,0.7)',
              textDecoration: 'none', transition: 'color 0.2s ease',
            }}>
              WELCOME, {user.username.toUpperCase()}
            </Link>
            <button
              onClick={() => { logout(); navigate('/') }}
              style={{ fontSize: '0.65rem', letterSpacing: '0.15em', padding: '6px 14px' }}
            >
              SIGN OUT
            </button>
          </div>
        ) : (
          <Link to="/login" style={linkStyle('/login')}>SIGN IN</Link>
        )}
      </div>
    </nav>
  )
}