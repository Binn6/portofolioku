import { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { useApi } from '../../hooks/useApi'
import { adminGetEducation, adminCreateEducation, adminUpdateEducation, adminDeleteEducation } from '../../services/api'
import { Pencil, Trash2, Plus } from 'lucide-react'

const empty = { institution: '', degree: '', field: '', start_year: '', end_year: '', description: '' }

export default function Education() {
  const { data: edu, loading } = useApi(adminGetEducation)
  const [list, setList] = useState(null)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  const items = list ?? edu ?? []

  const openCreate = () => { setForm(empty); setModal('create') }
  const openEdit = (e) => {
    setForm({ institution: e.institution, degree: e.degree, field: e.field, start_year: e.start_year, end_year: e.end_year || '', description: e.description || '' })
    setModal(e._id)
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = { ...form, start_year: +form.start_year, end_year: form.end_year ? +form.end_year : null }
      if (modal === 'create') {
        const { data } = await adminCreateEducation(payload)
        setList([...items, data])
      } else {
        const { data } = await adminUpdateEducation(modal, payload)
        setList(items.map((e) => (e._id === modal ? data : e)))
      }
      setModal(null)
    } finally { setSaving(false) }
  }

  const remove = async (id) => {
    if (!confirm('Delete?')) return
    await adminDeleteEducation(id)
    setList(items.filter((e) => e._id !== id))
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-semibold text-accent">Education</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-accent text-background px-4 py-2 rounded-lg text-sm hover:bg-accent/90"><Plus size={16} /> Add</button>
      </div>
      {loading ? <p className="text-accent-muted">Loading...</p> : (
        <div className="space-y-3">
          {items.map((e) => (
            <div key={e._id} className="glass rounded-xl p-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-accent">{e.institution}</p>
                <p className="text-sm text-accent-muted">{e.degree} — {e.field}</p>
                <p className="text-xs text-accent-dim">{e.start_year} – {e.end_year || 'Present'}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(e)} className="text-accent-muted hover:text-accent"><Pencil size={14} /></button>
                <button onClick={() => remove(e._id)} className="text-accent-muted hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-xl p-6 w-full max-w-lg">
            <h2 className="font-semibold text-accent mb-6">{modal === 'create' ? 'Add Education' : 'Edit Education'}</h2>
            <div className="flex flex-col gap-4">
              {['institution', 'degree', 'field'].map((k) => (
                <input key={k} className="bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-accent w-full" placeholder={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              ))}
              <div className="grid grid-cols-2 gap-4">
                <input type="number" className="bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-accent w-full" placeholder="Start year" value={form.start_year} onChange={(e) => setForm({ ...form, start_year: e.target.value })} />
                <input type="number" className="bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-accent w-full" placeholder="End year (blank = present)" value={form.end_year} onChange={(e) => setForm({ ...form, end_year: e.target.value })} />
              </div>
              <textarea className="bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-accent w-full h-20 resize-none" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="flex gap-3 justify-end">
                <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-accent-muted hover:text-accent">Cancel</button>
                <button onClick={save} disabled={saving} className="px-4 py-2 text-sm bg-accent text-background rounded-lg hover:bg-accent/90 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
