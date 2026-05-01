import { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { useApi } from '../../hooks/useApi'
import { adminGetExperiences, adminCreateExperience, adminUpdateExperience, adminDeleteExperience } from '../../services/api'
import { Pencil, Trash2, Plus } from 'lucide-react'

const empty = { title: '', company: '', type: 'internship', start_date: '', end_date: '', description: '', is_current: false }

export default function Experiences() {
  const { data: exps, loading } = useApi(adminGetExperiences)
  const [list, setList] = useState(null)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  const items = list ?? exps ?? []

  const openCreate = () => { setForm(empty); setModal('create') }
  const openEdit = (e) => {
    setForm({ title: e.title, company: e.company, type: e.type, start_date: e.start_date, end_date: e.end_date || '', description: e.description, is_current: e.is_current || false })
    setModal(e._id)
  }

  const save = async () => {
    setSaving(true)
    try {
      if (modal === 'create') {
        const { data } = await adminCreateExperience(form)
        setList([...items, data])
      } else {
        const { data } = await adminUpdateExperience(modal, form)
        setList(items.map((e) => (e._id === modal ? data : e)))
      }
      setModal(null)
    } finally { setSaving(false) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this experience?')) return
    await adminDeleteExperience(id)
    setList(items.filter((e) => e._id !== id))
  }

  const field = (key, label, type = 'text') => (
    <input key={key} type={type} className="bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-accent w-full" placeholder={label} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
  )

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-semibold text-accent">Experiences</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-accent text-background px-4 py-2 rounded-lg text-sm hover:bg-accent/90"><Plus size={16} /> Add</button>
      </div>
      {loading ? <p className="text-accent-muted">Loading...</p> : (
        <div className="space-y-3">
          {items.map((exp) => (
            <div key={exp._id} className="glass rounded-xl p-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-accent-dim uppercase mb-1">{exp.type} · {exp.start_date} – {exp.is_current ? 'Present' : exp.end_date}</p>
                <p className="font-semibold text-accent">{exp.title}</p>
                <p className="text-sm text-accent-muted">{exp.company}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(exp)} className="text-accent-muted hover:text-accent"><Pencil size={14} /></button>
                <button onClick={() => remove(exp._id)} className="text-accent-muted hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-xl p-6 w-full max-w-lg">
            <h2 className="font-semibold text-accent mb-6">{modal === 'create' ? 'Add Experience' : 'Edit Experience'}</h2>
            <div className="flex flex-col gap-4">
              {field('title', 'Title')}
              {field('company', 'Company')}
              <select className="bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-accent w-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="internship">Internship</option>
                <option value="organization">Organization</option>
              </select>
              {field('start_date', 'Start date (e.g. 2025-01)')}
              {!form.is_current && field('end_date', 'End date (e.g. 2025-06)')}
              <label className="flex items-center gap-2 text-sm text-accent-muted cursor-pointer">
                <input type="checkbox" checked={form.is_current} onChange={(e) => setForm({ ...form, is_current: e.target.checked })} />
                Currently working here
              </label>
              <textarea className="bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-accent w-full h-24 resize-none" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
