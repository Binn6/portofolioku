import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Terminal, Trophy, User, ChevronDown, LogOut } from 'lucide-react'

export function SqlGameNavbar({ player, onLogin, onLogout, onLeaderboard }) {
  const navigate    = useNavigate()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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

        {player ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(o => !o)}
              className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 border border-sql-primary/40 rounded
                text-sql-primary hover:bg-sql-primary/10 transition-colors"
            >
              <User size={11} />
              <span>{player.username}</span>
              <ChevronDown size={10} />
            </button>
            {open && (
              <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded shadow-lg z-20 min-w-[120px]">
                <button
                  onClick={() => { setOpen(false); onLogout() }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[11px] font-mono text-sql-dim hover:text-accent hover:bg-background transition-colors"
                >
                  <LogOut size={11} /> KELUAR
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 border border-sql-primary/40 rounded
              text-sql-primary hover:bg-sql-primary/10 transition-colors"
          >
            <User size={11} />
            <span>LOGIN</span>
          </button>
        )}
      </div>
    </header>
  )
}
