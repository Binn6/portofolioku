import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import { adminGetProfile, adminUpdateProfile } from '../../services/api'

const FIELDS = [
  { key: 'name',      label: 'Full Name',      type: 'text' },
  { key: 'title',     label: 'Title / Role',   type: 'text' },
  { key: 'location',  label: 'Location',       type: 'text' },
  { key: 'email',     label: 'Email',          type: 'email' },
  { key: 'phone',     label: 'Phone',          type: 'text' },
  { key: 'github',    label: 'GitHub URL',     type: 'url' },
  { key: 'linkedin',  label: 'LinkedIn URL',   type: 'url' },
  { key: 'instagram', label: 'Instagram URL',  type: 'url' },
]

export default function AdminProfile() {
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    adminGetProfile()
      .then(({ data }) => setForm(data || {}))
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setSuccess(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = { ...form }
      // Laravel's nullable|url validation rejects empty strings — send null instead
      ;['github', 'linkedin', 'instagram'].forEach((k) => {
        if (payload[k] === '') payload[k] = null
      })
      await adminUpdateProfile(payload)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminLayout><p className="text-accent-muted">Loading...</p></AdminLayout>

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-semibold text-accent">Profile Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-accent text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50"
        >
          <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {success && <p className="text-green-400 text-sm mb-6">Profile saved successfully.</p>}
      {error && <p className="text-red-400 text-sm mb-6">{error}</p>}

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
        {FIELDS.map(({ key, label, type }) => (
          <div key={key} className={key === 'title' ? 'md:col-span-2' : ''}>
            <label className="block text-xs text-accent-muted mb-1.5 uppercase tracking-wide">{label}</label>
            <input
              type={type}
              value={form[key] || ''}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-accent placeholder-accent-muted focus:outline-none focus:border-accent-dim transition-colors"
            />
          </div>
        ))}

        <div className="md:col-span-2">
          <label className="block text-xs text-accent-muted mb-1.5 uppercase tracking-wide">Bio</label>
          <textarea
            rows={5}
            value={form.bio || ''}
            onChange={(e) => handleChange('bio', e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-accent placeholder-accent-muted focus:outline-none focus:border-accent-dim transition-colors resize-none"
          />
        </div>
      </div>
    </AdminLayout>
  )
}
