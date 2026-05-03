import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Console from './pages/Console'
import Rooms from './pages/Rooms'
import Login from './pages/Login'
import Register from './pages/Register'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/console" element={<Console />} />
      <Route path="/rooms" element={<Rooms />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  )
}