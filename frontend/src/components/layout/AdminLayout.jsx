import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import {
  LayoutDashboard, FolderKanban, Wrench, Briefcase,
  GraduationCap, Award, FileText, MessageSquare,
  MessageCircle, User,
  LogOut, Menu, X,
} from 'lucide-react'

const navItems = [
  { to: '/admin/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/profile',    icon: User,             label: 'Profile' },
  { to: '/admin/projects',   icon: FolderKanban,     label: 'Projects' },
  { to: '/admin/skills',     icon: Wrench,           label: 'Skills' },
  { to: '/admin/experiences',icon: Briefcase,        label: 'Experiences' },
  { to: '/admin/education',  icon: GraduationCap,    label: 'Education' },
  { to: '/admin/certificates',icon: Award,           label: 'Certificates' },
  { to: '/admin/cv',         icon: FileText,         label: 'CV' },
  { to: '/admin/chat',       icon: MessageCircle,    label: 'Chat' },
  { to: '/admin/messages',   icon: MessageSquare,    label: 'Messages' },
]

export default function AdminLayout({ children }) {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)

  const handleLogout = async () => {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="flex h-screen bg-background text-accent overflow-hidden">
      <AnimatePresence>
        <motion.aside
          initial={false}
          animate={{ width: open ? 240 : 64 }}
          className="h-full bg-surface border-r border-border flex flex-col shrink-0 overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            {open && (
              <span className="font-display font-semibold text-base truncate">Admin</span>
            )}
            <button
              onClick={() => setOpen(!open)}
              className="text-accent-muted hover:text-accent ml-auto"
            >
              {open ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
          <nav className="flex-1 py-4 flex flex-col gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'text-accent bg-surface-2'
                      : 'text-accent-muted hover:text-accent hover:bg-surface-2'
                  }`
                }
              >
                <Icon size={16} className="shrink-0" />
                {open && <span className="truncate">{label}</span>}
              </NavLink>
            ))}
          </nav>
          <div className="p-4 border-t border-border">
            {open && (
              <p className="text-xs text-accent-muted truncate mb-3">{user?.name}</p>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 text-sm text-accent-muted hover:text-accent w-full"
            >
              <LogOut size={16} />
              {open && 'Logout'}
            </button>
          </div>
        </motion.aside>
      </AnimatePresence>
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}
