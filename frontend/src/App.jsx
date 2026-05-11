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
import AdminProfile from './pages/admin/Profile'
import AdminChat from './pages/admin/Chat'
import More from './pages/admin/More'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Portfolio />} />
          <Route path="/binn/login" element={<Login />} />
          <Route path="/binn" element={<Navigate to="/binn/dashboard" replace />} />
          <Route path="/binn/dashboard"    element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/binn/profile"      element={<RequireAuth><AdminProfile /></RequireAuth>} />
          <Route path="/binn/projects"     element={<RequireAuth><Projects /></RequireAuth>} />
          <Route path="/binn/skills"       element={<RequireAuth><Skills /></RequireAuth>} />
          <Route path="/binn/experiences"  element={<RequireAuth><Experiences /></RequireAuth>} />
          <Route path="/binn/education"    element={<RequireAuth><Education /></RequireAuth>} />
          <Route path="/binn/certificates" element={<RequireAuth><Certificates /></RequireAuth>} />
          <Route path="/binn/cv"           element={<RequireAuth><CV /></RequireAuth>} />
          <Route path="/binn/chat"         element={<RequireAuth><AdminChat /></RequireAuth>} />
          <Route path="/binn/messages"     element={<RequireAuth><Messages /></RequireAuth>} />
          <Route path="/binn/more"         element={<RequireAuth><More /></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
