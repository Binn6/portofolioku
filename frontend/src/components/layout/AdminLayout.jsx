import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import {
  LayoutDashboard, FolderKanban, Wrench, Briefcase,
  GraduationCap, Award, FileText, MessageSquare, User,
  LogOut, Menu, X, Grid2x2, Database, Layers, FolderOpen, Target,
} from 'lucide-react'

const navItems = [
  { to: '/binn/dashboard',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/binn/profile',              icon: User,            label: 'Profile' },
  { to: '/binn/projects',             icon: FolderKanban,    label: 'Projects' },
  { to: '/binn/skills',               icon: Wrench,          label: 'Skills' },
  { to: '/binn/experiences',          icon: Briefcase,       label: 'Experiences' },
  { to: '/binn/education',            icon: GraduationCap,   label: 'Education' },
  { to: '/binn/certificates',         icon: Award,           label: 'Certificates' },
  { to: '/binn/cv',                   icon: FileText,        label: 'CV' },
  { to: '/binn/messages',             icon: MessageSquare,   label: 'Messages' },
  { to: '/binn/sql-game/chapters',    icon: Layers,          label: 'SQL Chapters' },
  { to: '/binn/sql-game/subchapters', icon: FolderOpen,      label: 'SQL Sub-BAB' },
  { to: '/binn/sql-game/datasets',    icon: Database,        label: 'SQL Datasets' },
  { to: '/binn/sql-game/missions',    icon: Target,          label: 'SQL Missions' },
]

export default function AdminLayout({ children }) {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)

  const handleLogout = async () => {
    await signOut()
    navigate('/binn/login')
  }

  return (
    <div className="flex h-screen bg-background text-accent overflow-hidden">
      <AnimatePresence>
        <motion.aside
          initial={false}
          animate={{ width: open ? 240 : 64 }}
          className="hidden md:flex h-full bg-surface border-r border-border flex-col shrink-0 overflow-hidden"
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
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">{children}</main>

      {/* Bottom nav — mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden bg-surface border-t border-border h-16">
        {[
          { to: '/binn/dashboard', icon: LayoutDashboard, label: 'Home' },
          { to: '/binn/projects',  icon: FolderKanban,    label: 'Projects' },
          { to: '/binn/profile',   icon: User,            label: 'Profile' },
          { to: '/binn/messages',  icon: MessageSquare,   label: 'Messages' },
          { to: '/binn/more',      icon: Grid2x2,         label: 'More' },
        ].map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-accent' : 'text-accent-muted'
              }`
            }
          >
            <Icon size={20} />
            <span className="text-[10px]">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
