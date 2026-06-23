// frontend/src/components/sql-game/auth/RegisterForm.jsx
import { useState } from 'react'
import { sqlPlayerRegister } from '../../../services/api'

export function RegisterForm({ onSuccess, onLogin }) {
  const [form, setForm]     = useState({ username: '', email: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      const { token, player } = await sqlPlayerRegister(form)
      onSuccess(player, token)
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) setErrors(data.errors)
      else setErrors({ _general: data?.message ?? 'Registrasi gagal.' })
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-background border border-border rounded px-3 py-2 text-accent text-sm font-mono outline-none focus:border-sql-primary'
  const errCls   = 'text-red-400 text-xs font-mono mt-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs text-sql-dim mb-1 font-mono uppercase tracking-widest">Username</label>
        <input value={form.username} onChange={set('username')} required maxLength={30} className={inputCls} />
        {errors.username && <p className={errCls}>{errors.username[0]}</p>}
      </div>
      <div>
        <label className="block text-xs text-sql-dim mb-1 font-mono uppercase tracking-widest">Email</label>
        <input type="email" value={form.email} onChange={set('email')} required className={inputCls} />
        {errors.email && <p className={errCls}>{errors.email[0]}</p>}
      </div>
      <div>
        <label className="block text-xs text-sql-dim mb-1 font-mono uppercase tracking-widest">Password</label>
        <input type="password" value={form.password} onChange={set('password')} required minLength={8} className={inputCls} />
        {errors.password && <p className={errCls}>{errors.password[0]}</p>}
      </div>
      <div>
        <label className="block text-xs text-sql-dim mb-1 font-mono uppercase tracking-widest">Konfirmasi Password</label>
        <input type="password" value={form.password_confirmation} onChange={set('password_confirmation')} required className={inputCls} />
      </div>
      {errors._general && <p className={errCls}>{errors._general}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 rounded border border-sql-primary text-sql-primary text-sm font-mono
          hover:bg-sql-primary/10 transition-colors disabled:opacity-50"
      >
        {loading ? 'LOADING...' : 'DAFTAR'}
      </button>
      <p className="text-center text-xs font-mono text-sql-dim">
        Sudah punya akun?{' '}
        <button type="button" onClick={onLogin} className="text-sql-primary hover:underline">Login</button>
      </p>
    </form>
  )
}
