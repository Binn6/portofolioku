import { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { useApi } from '../../hooks/useApi'
import { useConfirm } from '../../hooks/useConfirm'
import { adminGetSkills, adminCreateSkill, adminUpdateSkill, adminDeleteSkill } from '../../services/api'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Pencil, Trash2, Plus } from 'lucide-react'

const CATEGORIES = ['Languages', 'Frameworks', 'Data', 'Tools', 'Soft Skills']
const empty = { name: '', category: 'Languages', level: 3 }
const gid = (item) => item.id ?? item._id

export default function Skills() {
  const { data: skills, loading } = useApi(adminGetSkills)
  const [list, setList] = useState(null)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const { confirm, dialogProps } = useConfirm()

  const items = list ?? skills ?? []

  const openCreate = () => { setForm(empty); setSaveError(null); setModal('create') }
  const openEdit = (skill) => {
    setForm({ name: skill.name, category: skill.category, level: skill.level })
    setSaveError(null)
    setModal(gid(skill))
  }

  const save = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      if (modal === 'create') {
        const { data } = await adminCreateSkill(form)
        setList([...items, data])
      } else {
        const { data } = await adminUpdateSkill(modal, form)
        setList(items.map((s) => (gid(s) === modal ? data : s)))
      }
      setModal(null)
    } catch (err) {
      const errors = err?.response?.data?.errors
      setSaveError(errors ? Object.values(errors).flat().join(' ') : (err?.response?.data?.message || 'Save failed. Please try again.'))
    } finally { setSaving(false) }
  }

  const remove = async (id) => {
    const ok = await confirm('This skill will be permanently deleted.')
    if (!ok) return
    await adminDeleteSkill(id)
    setList(items.filter((s) => gid(s) !== id))
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-4 md:mb-8">
        <h1 className="font-display text-2xl font-semibold text-accent">Skills</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-accent text-background px-4 py-2 rounded-lg text-sm hover:bg-accent/90">
          <Plus size={16} /> Add Skill
        </button>
      </div>

      {loading ? <p className="text-accent-muted">Loading...</p> : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[360px]">
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
                <tr key={gid(skill)} className="border-b border-border last:border-0">
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
                    <button onClick={() => remove(gid(skill))} className="text-accent-muted hover:text-red-400"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="glass rounded-t-2xl md:rounded-xl p-6 w-full md:max-w-sm max-h-[90vh] overflow-y-auto">
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

      <ConfirmDialog {...dialogProps} title="Delete Skill" />
    </AdminLayout>
  )
}
