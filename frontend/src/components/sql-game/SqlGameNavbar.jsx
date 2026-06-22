import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Terminal, Trophy, User } from 'lucide-react'

/**
 * @param {{ onLeaderboard?: () => void, onLogin?: () => void, username?: string|null }} props
 */
export function SqlGameNavbar({ onLeaderboard, onLogin, username }) {
  const navigate = useNavigate()

  return (
    <header className="flex items-center justify-between px-4 h-11 border-b border-border bg-surface flex-shrink-0 z-10">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-[11px] font-mono text-sql-dim hover:text-accent transition-colors"
        >
          <ArrowLeft size={12} /> BACK
        </button>
        <span className="text-border">│</span>
        <div className="flex items-center gap-1.5">
          <Terminal size={12} className="text-sql-primary" />
          <span className="text-[11px] font-mono text-sql-primary tracking-widest hidden sm:block">
            SQL MISSION CONTROL
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          onClick={onLeaderboard}
          className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 border border-border rounded
            text-sql-dim hover:text-accent hover:border-accent transition-colors"
        >
          <Trophy size={11} /> LEADERBOARD
        </button>
        <button
          onClick={onLogin}
          className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 border border-sql-primary/40 rounded
            text-sql-primary hover:bg-sql-primary/10 transition-colors"
        >
          <User size={11} />
          <span>{username ?? 'LOGIN'}</span>
        </button>
      </div>
    </header>
  )
}
