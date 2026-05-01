import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ login: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signIn(form)
      navigate('/binn/dashboard')
    } catch {
      setError('Invalid credentials. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold text-accent mb-2">Admin Login</h1>
        <p className="text-sm text-accent-muted mb-8">Sign in to manage your portfolio</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-accent placeholder-accent-dim focus:outline-none focus:border-accent-muted transition-colors"
            placeholder="Username or email"
            value={form.login}
            onChange={(e) => setForm({ ...form, login: e.target.value })}
            required
          />
          <input
            type="password"
            className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-accent placeholder-accent-dim focus:outline-none focus:border-accent-muted transition-colors"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-background rounded-lg py-3 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
