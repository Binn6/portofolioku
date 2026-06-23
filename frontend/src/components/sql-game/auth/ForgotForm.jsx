// frontend/src/components/sql-game/auth/ForgotForm.jsx
import { useState } from 'react'
import { sqlPlayerForgotPassword } from '../../../services/api'

export function ForgotForm({ onBack }) {
  const [email, setEmail]     = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      const res = await sqlPlayerForgotPassword(email)
      setMessage(res.message ?? 'Email reset password telah dikirim.')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Gagal mengirim email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-sql-dim font-mono">Masukkan email akunmu dan kami akan mengirim link reset password.</p>
      <div>
        <label className="block text-xs text-sql-dim mb-1 font-mono uppercase tracking-widest">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full bg-background border border-border rounded px-3 py-2 text-accent text-sm font-mono outline-none focus:border-sql-primary"
        />
      </div>
      {error   && <p className="text-red-400 text-xs font-mono">{error}</p>}
      {message && <p className="text-sql-primary text-xs font-mono">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 rounded border border-sql-primary text-sql-primary text-sm font-mono
          hover:bg-sql-primary/10 transition-colors disabled:opacity-50"
      >
        {loading ? 'LOADING...' : 'KIRIM LINK RESET'}
      </button>
      <button type="button" onClick={onBack} className="w-full text-xs text-sql-dim font-mono hover:text-accent transition-colors">
        ← Kembali ke Login
      </button>
    </form>
  )
}
