// frontend/src/pages/admin/SqlGameMissions.jsx
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, GripVertical, Save, X } from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import AdminLayout from '../../components/layout/AdminLayout'
import {
  adminGetSqlMissions, adminGetSqlDatasets, adminCreateSqlMission,
  adminUpdateSqlMission, adminDeleteSqlMission, adminReorderSqlMissions,
} from '../../services/api'
import { useConfirm } from '../../hooks/useConfirm'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import MissionForm from './sql-game/MissionForm'

const emptyForm = {
  dataset_id: '', stage_order: 1, title: '', briefing: '',
  tables: [], tablesRaw: '', objectives: [{ col: '', desc: '' }],
  ordering_hint: '', ordered: false, starter_sql: '', solution_query: '',
  rank_unlock: '', is_active: true,
}

function SortableRow({ mission, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: mission.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="text-accent-muted cursor-grab active:cursor-grabbing">
          <GripVertical size={16} />
        </button>
        <div>
          <span className="text-xs text-accent-muted mr-2">Stage {mission.stage_order}</span>
          <span className="text-accent text-sm font-medium">{mission.title}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onEdit(mission)} className="p-1.5 text-accent-muted hover:text-accent">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDelete(mission)} className="p-1.5 text-accent-muted hover:text-red-400">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

export default function SqlGameMissions() {
  const [missions, setMissions] = useState([])
  const [datasets, setDatasets] = useState([])
  const [filterDataset, setFilterDataset] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { confirm, dialogProps } = useConfirm()
  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    adminGetSqlDatasets().then(setDatasets)
    loadMissions()
  }, [])

  useEffect(() => { loadMissions() }, [filterDataset])

  const loadMissions = () => adminGetSqlMissions(filterDataset || null).then(setMissions)

  const openCreate = () => {
    setForm({ ...emptyForm, dataset_id: filterDataset || '' })
    setEditId(null)
    setModal(true)
  }

  const openEdit = (m) => {
    setForm({ ...emptyForm, ...m, tablesRaw: (m.tables || []).join(', ') })
    setEditId(m.id)
    setModal(true)
  }

  const handleDelete = async (m) => {
    if (!await confirm(`Hapus mission "${m.title}"?`)) return
    await adminDeleteSqlMission(m.id)
    loadMissions()
  }

  const handleSave = async () => {
    if (!form.title || !form.dataset_id || !form.solution_query) {
      setError('Judul, Dataset, dan Solution Query wajib diisi')
      return
    }
    setSaving(true)
    setError('')
    const payload = { ...form }
    delete payload.tablesRaw
    try {
      if (editId) await adminUpdateSqlMission(editId, payload)
      else await adminCreateSqlMission(payload)
      setModal(false)
      loadMissions()
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIdx = missions.findIndex(m => m.id === active.id)
    const newIdx = missions.findIndex(m => m.id === over.id)
    const reordered = arrayMove(missions, oldIdx, newIdx)
    setMissions(reordered)
    await adminReorderSqlMissions(reordered.map(m => m.id))
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-accent">SQL Game — Missions</h1>
          <button onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-accent text-background rounded-lg">
            <Plus size={14} /> New Mission
          </button>
        </div>

        <div className="mb-4">
          <select value={filterDataset} onChange={e => setFilterDataset(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-accent text-sm outline-none focus:border-accent">
            <option value="">Semua Dataset</option>
            {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={missions.map(m => m.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {missions.length === 0
                ? <p className="text-accent-muted text-sm">Belum ada mission untuk dataset ini.</p>
                : missions.map(m => (
                    <SortableRow key={m.id} mission={m} onEdit={openEdit} onDelete={handleDelete} />
                  ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Mission Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-surface border border-border rounded-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-accent font-semibold">{editId ? 'Edit Mission' : 'New Mission'}</h3>
              <button onClick={() => setModal(false)} className="text-accent-muted hover:text-accent">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <MissionForm form={form} onChange={setForm} datasets={datasets} />
              {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
              <div className="flex gap-3 mt-4">
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-accent text-background rounded-lg text-sm font-medium disabled:opacity-50">
                  <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button onClick={() => setModal(false)}
                  className="px-5 py-2 border border-border rounded-lg text-sm text-accent-muted hover:text-accent">
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </AdminLayout>
  )
}
