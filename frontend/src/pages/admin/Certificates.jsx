import { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { useApi } from '../../hooks/useApi'
import { useConfirm } from '../../hooks/useConfirm'
import { adminGetCertificates, adminCreateCertificate, adminUpdateCertificate, adminDeleteCertificate } from '../../services/api'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Pencil, Trash2, Plus } from 'lucide-react'

const empty = { title: '', issuer: '', date: '', category: 'Web' }
const gid = (item) => item.id ?? item._id

export default function Certificates() {
  const { data: certs, loading } = useApi(adminGetCertificates)
  const [list, setList] = useState(null)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const { confirm, dialogProps } = useConfirm()

  const items = list ?? certs ?? []

  const openCreate = () => { setForm(empty); setFile(null); setSaveError(null); setModal('create') }
  const openEdit = (c) => {
    setForm({ title: c.title, issuer: c.issuer, date: c.date, category: c.category })
    setFile(null)
    setSaveError(null)
    setModal(gid(c))
  }

  const save = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (file) fd.append('file', file)
      if (modal === 'create') {
        const { data } = await adminCreateCertificate(fd)
        setList([...items, data])
      } else {
        const { data } = await adminUpdateCertificate(modal, fd)
        setList(items.map((c) => (gid(c) === modal ? data : c)))
      }
      setModal(null)
    } catch (err) {
      const errors = err?.response?.data?.errors
      setSaveError(errors ? Object.values(errors).flat().join(' ') : (err?.response?.data?.message || 'Save failed. Please try again.'))
    } finally { setSaving(false) }
  }

  const remove = async (id) => {
    const ok = await confirm('This certificate will be permanently deleted.')
    if (!ok) return
    await adminDeleteCertificate(id)
    setList(items.filter((c) => gid(c) !== id))
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-4 md:mb-8">
        <h1 className="font-display text-2xl font-semibold text-accent">Certificates</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-accent text-background px-4 py-2 rounded-lg text-sm hover:bg-accent/90"><Plus size={16} /> Add</button>
      </div>

      {loading ? <p className="text-accent-muted">Loading...</p> : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b border-border text-accent-muted text-xs uppercase">
                <th className="text-left p-4">Title</th>
                <th className="text-left p-4">Issuer</th>
                <th className="text-left p-4">Category</th>
                <th className="text-left p-4">Date</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={gid(c)} className="border-b border-border last:border-0">
                  <td className="p-4 text-accent">{c.title}</td>
                  <td className="p-4 text-accent-muted">{c.issuer}</td>
                  <td className="p-4 text-accent-muted">{c.category}</td>
                  <td className="p-4 text-accent-muted">{c.date}</td>
                  <td className="p-4 flex gap-2 justify-end">
                    <button onClick={() => openEdit(c)} className="text-accent-muted hover:text-accent"><Pencil size={14} /></button>
                    <button onClick={() => remove(gid(c))} className="text-accent-muted hover:text-red-400"><Trash2 size={14} /></button>
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
          <div className="glass rounded-t-2xl md:rounded-xl p-6 w-full md:max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="font-semibold text-accent mb-6">{modal === 'create' ? 'Add Certificate' : 'Edit Certificate'}</h2>
            <div className="flex flex-col gap-4">
              {['title', 'issuer', 'date'].map((k) => (
                <input key={k} className="bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-accent w-full" placeholder={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              ))}
              <select className="bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-accent w-full" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option>Web</option><option>Data</option>
              </select>
              <div>
                <p className="text-xs text-accent-muted mb-2">File (jpeg, png, webp, pdf, max 5MB)</p>
                <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFile(e.target.files[0])} className="text-sm text-accent-muted" />
              </div>
              {saveError && <p className="text-sm text-red-400">{saveError}</p>}
              <div className="flex gap-3 justify-end">
                <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-accent-muted hover:text-accent">Cancel</button>
                <button onClick={save} disabled={saving} className="px-4 py-2 text-sm bg-accent text-background rounded-lg hover:bg-accent/90 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog {...dialogProps} title="Delete Certificate" />
    </AdminLayout>
  )
}
