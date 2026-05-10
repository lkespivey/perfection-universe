import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Console from './pages/Console'
import Rooms from './pages/Rooms'
import Login from './pages/Login'
import Register from './pages/Register'
import FalseEnding from './pages/FalseEnding'
import Profile from './pages/Profile'
import Games from './pages/Games'
import AsteroidDrift from './pages/AsteroidDrift'
import EchoMatch from './pages/EchoMatch'
import SignalAlignment from './pages/SignalAlignment'
import MarsPage from './pages/MarsPage'
import RadarPage from './pages/RadarPage'
import Map from './pages/Map'
import EchoRoom from './pages/EchoRoom'

export default function App() {
  const location = useLocation()
  const isMap = location.pathname === '/map'

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: isMap ? '0' : '60px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/console" element={<Console />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/echo-room" element={<EchoRoom />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/arrival" element={<FalseEnding />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/games" element={<Games />} />
          <Route path="/games/asteroid-drift" element={<AsteroidDrift />} />
          <Route path="/games/echo-match" element={<EchoMatch />} />
          <Route path="/games/signal-alignment" element={<SignalAlignment />} />
          <Route path="/mars" element={<MarsPage />} />
          <Route path="/radar" element={<RadarPage />} />
          <Route path="/map" element={<Map />} />
        </Routes>
      </div>
    </>
  )
}