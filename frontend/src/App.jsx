import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RequireAuth from './components/admin/RequireAuth'
import Portfolio from './pages/Portfolio'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Projects from './pages/admin/Projects'
import Skills from './pages/admin/Skills'
import Experiences from './pages/admin/Experiences'
import Education from './pages/admin/Education'
import Certificates from './pages/admin/Certificates'
import CV from './pages/admin/CV'
import Messages from './pages/admin/Messages'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Portfolio />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/admin/projects" element={<RequireAuth><Projects /></RequireAuth>} />
          <Route path="/admin/skills" element={<RequireAuth><Skills /></RequireAuth>} />
          <Route path="/admin/experiences" element={<RequireAuth><Experiences /></RequireAuth>} />
          <Route path="/admin/education" element={<RequireAuth><Education /></RequireAuth>} />
          <Route path="/admin/certificates" element={<RequireAuth><Certificates /></RequireAuth>} />
          <Route path="/admin/cv" element={<RequireAuth><CV /></RequireAuth>} />
          <Route path="/admin/messages" element={<RequireAuth><Messages /></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
