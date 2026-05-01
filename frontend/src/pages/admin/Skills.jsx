import { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { useApi } from '../../hooks/useApi'
import { adminGetSkills, adminCreateSkill, adminUpdateSkill, adminDeleteSkill } from '../../services/api'
import { Pencil, Trash2, Plus } from 'lucide-react'

const CATEGORIES = ['Languages', 'Frameworks', 'Data', 'Tools', 'Soft Skills']
const empty = { name: '', category: 'Languages', level: 3 }

export default function Skills() {
  const { data: skills, loading } = useApi(adminGetSkills)
  const [list, setList] = useState(null)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  const items = list ?? skills ?? []

  const openCreate = () => { setForm(empty); setModal('create') }
  const openEdit = (skill) => {
    setForm({ name: skill.name, category: skill.category, level: skill.level })
    setModal(skill._id)
  }

  const save = async () => {
    setSaving(true)
    try {
      if (modal === 'create') {
        const { data } = await adminCreateSkill(form)
        setList([...items, data])
      } else {
        const { data } = await adminUpdateSkill(modal, form)
        setList(items.map((s) => (s._id === modal ? data : s)))
      }
      setModal(null)
    } finally { setSaving(false) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this skill?')) return
    await adminDeleteSkill(id)
    setList(items.filter((s) => s._id !== id))
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-semibold text-accent">Skills</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-accent text-background px-4 py-2 rounded-lg text-sm hover:bg-accent/90">
          <Plus size={16} /> Add Skill
        </button>
      </div>
      {loading ? (
        <p className="text-accent-muted">Loading...</p>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-accent-muted text-xs uppercase">
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Category</th>
                <th className="text-left p-4">Level</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {items.map((skill) => (
                <tr key={skill._id} className="border-b border-border last:border-0">
                  <td className="p-4 text-accent">{skill.name}</td>
                  <td className="p-4 text-accent-muted">{skill.category}</td>
                  <td className="p-4">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i < skill.level ? 'bg-accent' : 'bg-accent-dim'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="p-4 flex gap-2 justify-end">
                    <button onClick={() => openEdit(skill)} className="text-accent-muted hover:text-accent"><Pencil size={14} /></button>
                    <button onClick={() => remove(skill._id)} className="text-accent-muted hover:text-red-400"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-xl p-6 w-full max-w-sm">
            <h2 className="font-semibold text-accent mb-6">{modal === 'create' ? 'Add Skill' : 'Edit Skill'}</h2>
            <div className="flex flex-col gap-4">
              <input className="bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-accent w-full" placeholder="Skill name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <select className="bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-accent w-full" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <div>
                <label className="text-xs text-accent-muted mb-2 block">Level: {form.level}</label>
                <input type="range" min={1} max={5} value={form.level} onChange={(e) => setForm({ ...form, level: +e.target.value })} className="w-full" />
              </div>
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
    </AdminLayout>
  )
}
