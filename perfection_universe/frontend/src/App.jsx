import { Analytics } from "@vercel/analytics/next"
import { Routes, Route } from 'react-router-dom'
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

export default function App() {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '60px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/console" element={<Console />} />
          <Route path="/rooms" element={<Rooms />} />
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
        </Routes>
      </div>
    </>
  )
}