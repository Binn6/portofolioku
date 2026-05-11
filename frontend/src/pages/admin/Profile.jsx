import { useState, useEffect, useRef } from 'react'
import { Save, Camera, Loader2 } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import { adminGetProfile, adminUpdateProfile, adminUploadProfilePhoto } from '../../services/api'

const FIELDS = [
  { key: 'name',      label: 'Full Name',     type: 'text' },
  { key: 'title',     label: 'Title / Role',  type: 'text' },
  { key: 'location',  label: 'Location',      type: 'text' },
  { key: 'email',     label: 'Email',         type: 'email' },
  { key: 'phone',     label: 'Phone',         type: 'text' },
  { key: 'github',    label: 'GitHub URL',    type: 'url' },
  { key: 'linkedin',  label: 'LinkedIn URL',  type: 'url' },
  { key: 'instagram', label: 'Instagram URL', type: 'url' },
]

export default function AdminProfile() {
  const [form, setForm] = useState({})
  const [photoUrl, setPhotoUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    adminGetProfile()
      .then(({ data }) => {
        setForm(data || {})
        setPhotoUrl(data?.photo_url || null)
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setSuccess(false)
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      const { data } = await adminUploadProfilePhoto(fd)
      setPhotoUrl(data.photo_url)
    } catch {
      setError('Failed to upload photo. Max 2MB, jpeg/png/webp only.')
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const keys = ['name', 'title', 'bio', 'location', 'email', 'phone', 'github', 'linkedin', 'instagram']
      const payload = Object.fromEntries(
        keys.map((k) => [k, form[k] === '' ? null : (form[k] ?? null)])
      )
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

      {/* Photo upload */}
      <div className="mb-8">
        <label className="block text-xs text-accent-muted mb-3 uppercase tracking-wide">Profile Photo</label>
        <div className="flex items-center gap-5">
          <div
            onClick={() => !uploadingPhoto && fileRef.current?.click()}
            className="relative w-24 h-24 rounded-2xl bg-surface-2 border border-border overflow-hidden cursor-pointer group shrink-0"
          >
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-accent-muted text-2xl font-display font-bold select-none">
                {form.name?.charAt(0) || '?'}
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingPhoto
                ? <Loader2 size={20} className="text-white animate-spin" />
                : <Camera size={20} className="text-white" />
              }
            </div>
          </div>

          <div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingPhoto}
              className="px-4 py-2 text-sm bg-surface-2 border border-border rounded-lg text-accent hover:border-accent-dim transition-colors disabled:opacity-50"
            >
              {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
            </button>
            <p className="text-xs text-accent-muted mt-2">JPEG, PNG or WebP · max 2MB</p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>
      </div>

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
