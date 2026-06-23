// frontend/src/pages/ResetPassword.jsx
import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Terminal } from 'lucide-react'
import { sqlPlayerResetPassword } from '../services/api'

export default function ResetPassword() {
  const [params]   = useSearchParams()
  const navigate   = useNavigate()
  const [password, setPassword]                   = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [status, setStatus]   = useState(null)
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await sqlPlayerResetPassword({
        token:                 params.get('token'),
        email:                 params.get('email'),
        password,
        password_confirmation: passwordConfirmation,
      })
      setStatus(res.message ?? 'Password berhasil direset.')
      setTimeout(() => navigate('/sql-mission-control'), 3000)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Terjadi kesalahan. Link mungkin sudah kadaluarsa.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-[#c9d1d9] text-sm font-mono outline-none focus:border-[#00FF41]'

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#161b22] border border-[#30363d] rounded-lg p-6 font-mono">
        <div className="flex items-center gap-2 mb-6">
          <Terminal size={14} className="text-[#00FF41]" />
          <span className="text-xs text-[#00FF41] tracking-widest uppercase">Reset Password</span>
        </div>

        {status ? (
          <div className="space-y-3">
            <p className="text-[#00FF41] text-sm">{status}</p>
            <p className="text-[#8b949e] text-xs">Mengalihkan ke game dalam 3 detik...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-[#8b949e] mb-1 uppercase tracking-widest">Password Baru</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                required minLength={8} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-[#8b949e] mb-1 uppercase tracking-widest">Konfirmasi Password</label>
              <input type="password" value={passwordConfirmation} onChange={e => setPasswordConfirmation(e.target.value)}
                required className={inputCls} />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded border border-[#00FF41] text-[#00FF41] text-sm
                hover:bg-[#00FF41]/10 transition-colors disabled:opacity-50"
            >
              {loading ? 'LOADING...' : 'RESET PASSWORD'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
