// frontend/src/pages/admin/sql-game/MissionForm.jsx
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

const emptyObjective = { col: '', desc: '' }

export default function MissionForm({ form, onChange, datasets }) {
  const set = (key) => (e) => onChange({ ...form, [key]: e.target.value })
  const setCheck = (key) => (e) => onChange({ ...form, [key]: e.target.checked })

  const setTables = (e) => {
    const raw = e.target.value
    onChange({ ...form, tablesRaw: raw, tables: raw.split(',').map(s => s.trim()).filter(Boolean) })
  }

  const addObjective = () => onChange({ ...form, objectives: [...form.objectives, { ...emptyObjective }] })
  const removeObjective = (i) => onChange({ ...form, objectives: form.objectives.filter((_, idx) => idx !== i) })
  const setObjective = (i, key, val) => {
    const objs = [...form.objectives]
    objs[i] = { ...objs[i], [key]: val }
    onChange({ ...form, objectives: objs })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-accent-muted mb-1">Judul Mission *</label>
          <input value={form.title} onChange={set('title')}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent" />
        </div>
        <div>
          <label className="block text-xs text-accent-muted mb-1">Dataset *</label>
          <select value={form.dataset_id} onChange={set('dataset_id')}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent">
            <option value="">Pilih dataset...</option>
            {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-accent-muted mb-1">Stage Order *</label>
          <input type="number" min="1" value={form.stage_order} onChange={set('stage_order')}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent" />
        </div>
        <div>
          <label className="block text-xs text-accent-muted mb-1">Rank Unlock</label>
          <input value={form.rank_unlock} onChange={set('rank_unlock')} placeholder="Query Runner"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-accent-muted mb-1">Briefing *</label>
        <textarea value={form.briefing} onChange={set('briefing')} rows={3}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent resize-none" />
      </div>

      <div>
        <label className="block text-xs text-accent-muted mb-1">Tabel (pisahkan dengan koma)</label>
        <input value={form.tablesRaw} onChange={setTables} placeholder="instruktur, kursus, pendaftaran"
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-accent-muted">Objectives *</label>
          <button type="button" onClick={addObjective}
            className="flex items-center gap-1 text-xs text-accent-muted hover:text-accent">
            <Plus size={12} /> Tambah
          </button>
        </div>
        {form.objectives.map((obj, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input value={obj.col} onChange={e => setObjective(i, 'col', e.target.value)}
              placeholder="nama_kolom"
              className="w-1/3 bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent font-mono" />
            <input value={obj.desc} onChange={e => setObjective(i, 'desc', e.target.value)}
              placeholder="Deskripsi objektif"
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent" />
            <button type="button" onClick={() => removeObjective(i)}
              className="text-accent-muted hover:text-red-400 px-2">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs text-accent-muted mb-1">Ordering Hint (teks magenta di sidebar)</label>
        <input value={form.ordering_hint} onChange={set('ordering_hint')}
          placeholder="Urutkan berdasarkan total_mahasiswa DESC."
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent" />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-accent cursor-pointer">
          <input type="checkbox" checked={form.ordered} onChange={setCheck('ordered')} />
          Urutan baris diuji (ordered)
        </label>
        <label className="flex items-center gap-2 text-sm text-accent cursor-pointer">
          <input type="checkbox" checked={form.is_active} onChange={setCheck('is_active')} />
          Aktif
        </label>
      </div>

      <div>
        <label className="block text-xs text-accent-muted mb-1">Starter SQL</label>
        <textarea value={form.starter_sql} onChange={set('starter_sql')} rows={4}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm font-mono outline-none focus:border-accent resize-y" />
      </div>

      <div>
        <label className="block text-xs text-accent-muted mb-1">Solution Query *</label>
        <textarea value={form.solution_query} onChange={set('solution_query')} rows={8}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm font-mono outline-none focus:border-accent resize-y" />
      </div>
    </div>
  )
}
