import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import AdminLayout from '../../components/layout/AdminLayout'
import { Wrench, Briefcase, GraduationCap, Award, FileText, LogOut } from 'lucide-react'

const items = [
  { to: '/binn/skills',       icon: Wrench,        label: 'Skills' },
  { to: '/binn/experiences',  icon: Briefcase,     label: 'Experiences' },
  { to: '/binn/education',    icon: GraduationCap, label: 'Education' },
  { to: '/binn/certificates', icon: Award,         label: 'Certificates' },
  { to: '/binn/cv',           icon: FileText,      label: 'CV' },
]

export default function More() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/binn/login')
  }

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-semibold text-accent mb-6 md:mb-8">More</h1>
      <div className="grid grid-cols-3 gap-4 max-w-xs">
        {items.map(({ to, icon: Icon, label }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="flex flex-col items-center gap-2 p-4 glass rounded-xl hover:bg-surface-2 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center">
              <Icon size={20} className="text-accent-muted" />
            </div>
            <span className="text-xs text-accent-muted">{label}</span>
          </button>
        ))}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-2 p-4 glass rounded-xl hover:bg-surface-2 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center">
            <LogOut size={20} className="text-red-400" />
          </div>
          <span className="text-xs text-red-400">Logout</span>
        </button>
      </div>
    </AdminLayout>
  )
}
