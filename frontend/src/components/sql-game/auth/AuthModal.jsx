// frontend/src/components/sql-game/auth/AuthModal.jsx
import { useState } from 'react'
import { X } from 'lucide-react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { ForgotForm } from './ForgotForm'

export function AuthModal({ onClose, onSuccess }) {
  const [view, setView] = useState('login') // 'login' | 'register' | 'forgot'

  const handleSuccess = (player, token) => {
    onSuccess(player, token)
    onClose()
  }

  const titles = { login: 'LOGIN', register: 'DAFTAR', forgot: 'LUPA PASSWORD' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-sm mx-4 bg-surface border border-border rounded-lg p-6 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs text-sql-primary tracking-widest uppercase">{titles[view]}</span>
          <button onClick={onClose} className="text-sql-dim hover:text-accent transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Tab switcher (login / register only — not shown on forgot) */}
        {view !== 'forgot' && (
          <div className="flex gap-2 mb-5">
            {['login', 'register'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 py-1 text-xs rounded border transition-colors ${
                  view === v
                    ? 'border-sql-primary text-sql-primary bg-sql-primary/10'
                    : 'border-border text-sql-dim hover:border-accent'
                }`}
              >
                {v === 'login' ? 'LOGIN' : 'DAFTAR'}
              </button>
            ))}
          </div>
        )}

        {view === 'login'    && <LoginForm    onSuccess={handleSuccess} onForgot={() => setView('forgot')} onRegister={() => setView('register')} />}
        {view === 'register' && <RegisterForm onSuccess={handleSuccess} onLogin={() => setView('login')} />}
        {view === 'forgot'   && <ForgotForm   onBack={() => setView('login')} />}
      </div>
    </div>
  )
}
