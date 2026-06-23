// frontend/src/components/sql-game/auth/LoginForm.jsx
import { useState } from 'react'
import { sqlPlayerLogin } from '../../../services/api'

export function LoginForm({ onSuccess, onForgot, onRegister }) {
  const [login, setLogin]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { token, player } = await sqlPlayerLogin({ login, password })
      onSuccess(player, token)
    } catch (err) {
      const msg = err.response?.data?.errors?.login?.[0]
        ?? err.response?.data?.message
        ?? 'Login gagal.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-background border border-border rounded px-3 py-2 text-accent text-sm font-mono outline-none focus:border-sql-primary'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-sql-dim mb-1 font-mono uppercase tracking-widest">Username / Email</label>
        <input value={login} onChange={e => setLogin(e.target.value)} required className={inputCls} />
      </div>
      <div>
        <label className="block text-xs text-sql-dim mb-1 font-mono uppercase tracking-widest">Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className={inputCls} />
      </div>
      {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 rounded border border-sql-primary text-sql-primary text-sm font-mono
          hover:bg-sql-primary/10 transition-colors disabled:opacity-50"
      >
        {loading ? 'LOADING...' : 'LOGIN'}
      </button>
      <div className="flex justify-between text-xs font-mono text-sql-dim">
        <button type="button" onClick={onForgot} className="hover:text-accent transition-colors">
          Lupa password?
        </button>
        <button type="button" onClick={onRegister} className="hover:text-accent transition-colors">
          Daftar akun
        </button>
      </div>
    </form>
  )
}
