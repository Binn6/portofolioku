import { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { useApi } from '../../hooks/useApi'
import { adminGetMessages, adminMarkRead } from '../../services/api'
import { MailOpen, Mail } from 'lucide-react'

export default function Messages() {
  const { data: messages, loading } = useApi(adminGetMessages)
  const [list, setList] = useState(null)

  const items = list ?? messages ?? []

  const markRead = async (id) => {
    try {
      await adminMarkRead(id)
      setList(items.map((m) => (String(m._id) === String(id) ? { ...m, is_read: true } : m)))
    } catch {
      // silent — button stays visible so user can retry
    }
  }

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-semibold text-accent mb-8">Messages</h1>
      {loading ? <p className="text-accent-muted">Loading...</p> : items.length === 0 ? (
        <p className="text-accent-muted">No messages yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <div key={m._id} className={`glass rounded-xl p-5 ${!m.is_read ? 'border-accent-dim' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  {m.is_read ? <MailOpen size={16} className="text-accent-dim" /> : <Mail size={16} className="text-accent" />}
                  <div>
                    <p className="font-semibold text-accent text-sm">{m.name}</p>
                    <p className="text-xs text-accent-muted">{m.email}</p>
                  </div>
                </div>
                {!m.is_read && (
                  <button onClick={() => markRead(m._id)} className="text-xs text-accent-muted hover:text-accent shrink-0">
                    Mark read
                  </button>
                )}
              </div>
              <p className="text-sm text-accent-muted mt-3 leading-relaxed">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
