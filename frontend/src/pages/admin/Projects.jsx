import { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { useApi } from '../../hooks/useApi'
import { useConfirm } from '../../hooks/useConfirm'
import { adminGetProjects, adminCreateProject, adminUpdateProject, adminDeleteProject } from '../../services/api'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Pencil, Trash2, Plus, ExternalLink, Code2 } from 'lucide-react'

const empty = { title: '', description: '', tech_stack: '', github_url: '', live_url: '', is_featured: false, type: '' }
const gid = (item) => item.id ?? item._id

export default function Projects() {
  const { data: projects, loading } = useApi(adminGetProjects)
  const [list, setList] = useState(null)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [thumbnail, setThumbnail] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const { confirm, dialogProps } = useConfirm()

  const items = list ?? projects ?? []

  const openCreate = () => { setForm(empty); setThumbnail(null); setSaveError(null); setModal('create') }
  const openEdit = (p) => {
    setForm({ title: p.title, description: p.description, tech_stack: (p.tech_stack || []).join(', '), github_url: p.github_url || '', live_url: p.live_url || '', is_featured: p.is_featured || false, type: p.type || '' })
    setThumbnail(null)
    setSaveError(null)
    setModal(gid(p))
  }

  const save = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('description', form.description)
      const tech = form.tech_stack.split(',').map((t) => t.trim()).filter(Boolean)
      tech.forEach((t) => fd.append('tech_stack[]', t))
      if (form.github_url) fd.append('github_url', form.github_url)
      if (form.live_url) fd.append('live_url', form.live_url)
      fd.append('is_featured', form.is_featured ? '1' : '0')
      if (form.type) fd.append('type', form.type)
      if (thumbnail) fd.append('thumbnail', thumbnail)

      if (modal === 'create') {
        const { data } = await adminCreateProject(fd)
        setList([...items, data])
      } else {
        const { data } = await adminUpdateProject(modal, fd)
        setList(items.map((p) => (gid(p) === modal ? data : p)))
      }
      setModal(null)
    } catch (err) {
      const errors = err?.response?.data?.errors
      const msg = errors
        ? Object.values(errors).flat().join(' ')
        : (err?.response?.data?.message || 'Save failed. Please try again.')
      setSaveError(msg)
    } finally { setSaving(false) }
  }

  const remove = async (id) => {
    const ok = await confirm('This project and its thumbnail will be permanently deleted.')
    if (!ok) return
    await adminDeleteProject(id)
    setList(items.filter((p) => gid(p) !== id))
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-4 md:mb-8">
        <h1 className="font-display text-2xl font-semibold text-accent">Projects</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-accent text-background px-4 py-2 rounded-lg text-sm hover:bg-accent/90">
          <Plus size={16} /> Add Project
        </button>
      </div>

      {loading ? <p className="text-accent-muted">Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => (
            <div key={gid(p)} className="glass rounded-xl p-5">
              {p.thumbnail_url && <img src={p.thumbnail_url} alt={p.title} className="rounded-lg mb-3 aspect-video object-cover w-full" />}
              <h3 className="font-semibold text-accent mb-1">{p.title}</h3>
              <p className="text-xs text-accent-muted line-clamp-2 mb-3">{p.description}</p>
              <div className="flex gap-3 items-center">
                {p.github_url && <a href={p.github_url} target="_blank" rel="noreferrer" className="text-accent-muted hover:text-accent"><Code2 size={14} /></a>}
                {p.live_url && <a href={p.live_url} target="_blank" rel="noreferrer" className="text-accent-muted hover:text-accent"><ExternalLink size={14} /></a>}
                <div className="ml-auto flex gap-2">
                  <button onClick={() => openEdit(p)} className="text-accent-muted hover:text-accent"><Pencil size={14} /></button>
                  <button onClick={() => remove(gid(p))} className="text-accent-muted hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="glass rounded-t-2xl md:rounded-xl p-6 w-full md:max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="font-semibold text-accent mb-6">{modal === 'create' ? 'Add Project' : 'Edit Project'}</h2>
            <div className="flex flex-col gap-4">
              {(['title', 'github_url', 'live_url']).map((f) => (
                <input key={f} className="bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-accent w-full" placeholder={f.replace('_', ' ')} value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
              ))}
              <textarea className="bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-accent w-full h-24 resize-none" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <input className="bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-accent w-full" placeholder="Tech stack (comma separated)" value={form.tech_stack} onChange={(e) => setForm({ ...form, tech_stack: e.target.value })} />
              <label className="flex items-center gap-2 text-sm text-accent-muted cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                Featured project
              </label>
              <div>
                <p className="text-xs text-accent-muted mb-2">Thumbnail (jpeg, png, webp, max 2MB)</p>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setThumbnail(e.target.files[0])} className="text-sm text-accent-muted" />
              </div>
              {saveError && <p className="text-sm text-red-400">{saveError}</p>}
              <div className="flex gap-3 justify-end">
                <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-accent-muted hover:text-accent">Cancel</button>
                <button onClick={save} disabled={saving} className="px-4 py-2 text-sm bg-accent text-background rounded-lg hover:bg-accent/90 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog {...dialogProps} title="Delete Project" />
    </AdminLayout>
  )
}
