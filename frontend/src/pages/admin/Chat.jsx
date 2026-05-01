import { useState, useEffect, useRef } from 'react'
import { Send, Trash2, RefreshCw } from 'lucide-react'
import AdminLayout from '../../components/layout/AdminLayout'
import { adminGetConversations, adminGetConversation, adminReply, adminDeleteConversation } from '../../services/api'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function AdminChat() {
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  const loadConversations = async () => {
    try {
      const { data } = await adminGetConversations()
      setConversations(data)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (sessionId) => {
    const { data } = await adminGetConversation(sessionId)
    setMessages(data)
  }

  useEffect(() => { loadConversations() }, [])

  // Poll for new messages while a conversation is open
  useEffect(() => {
    if (!selected) return
    loadMessages(selected.session_id)
    const id = setInterval(() => loadMessages(selected.session_id), 3000)
    return () => clearInterval(id)
  }, [selected?.session_id])

  // Poll conversation list every 5s
  useEffect(() => {
    const id = setInterval(loadConversations, 5000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSelect = (conv) => {
    setSelected(conv)
    setReply('')
    // Clear unread badge optimistically
    setConversations((prev) =>
      prev.map((c) => c.session_id === conv.session_id ? { ...c, unread: 0 } : c)
    )
  }

  const handleReply = async (e) => {
    e.preventDefault()
    if (!reply.trim() || !selected) return
    setSending(true)
    try {
      await adminReply(selected.session_id, reply.trim())
      setReply('')
      await loadMessages(selected.session_id)
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (sessionId) => {
    if (!confirm('Delete this entire conversation?')) return
    await adminDeleteConversation(sessionId)
    setConversations((prev) => prev.filter((c) => c.session_id !== sessionId))
    if (selected?.session_id === sessionId) { setSelected(null); setMessages([]) }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-accent">Live Chat</h1>
        <button onClick={loadConversations} className="text-accent-muted hover:text-accent">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="flex gap-0 glass rounded-xl overflow-hidden" style={{ height: 'calc(100vh - 160px)' }}>
        {/* Conversation list */}
        <div className="w-72 border-r border-border flex flex-col shrink-0">
          <div className="p-3 border-b border-border text-xs text-accent-muted uppercase tracking-wide">
            Conversations ({conversations.length})
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && <p className="text-accent-muted text-sm p-4">Loading...</p>}
            {!loading && conversations.length === 0 && (
              <p className="text-accent-muted text-sm p-4">No conversations yet.</p>
            )}
            {conversations.map((conv) => (
              <div
                key={conv.session_id}
                onClick={() => handleSelect(conv)}
                className={`p-3 cursor-pointer border-b border-border hover:bg-surface-2 transition-colors ${
                  selected?.session_id === conv.session_id ? 'bg-surface-2' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-medium text-accent truncate">{conv.name}</span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {conv.unread > 0 && (
                      <span className="text-xs bg-accent text-background rounded-full px-1.5 py-0.5 font-bold">
                        {conv.unread}
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(conv.session_id) }}
                      className="text-accent-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-accent-muted truncate">{conv.last_message}</p>
                <p className="text-xs text-accent-dim mt-0.5">{timeAgo(conv.last_at)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat thread */}
        <div className="flex-1 flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-accent-muted text-sm">
              Select a conversation to view messages
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-border">
                <p className="font-medium text-accent text-sm">{selected.name}</p>
                <p className="text-xs text-accent-muted">{selected.email}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === 'admin'
                          ? 'bg-accent text-background rounded-br-sm'
                          : 'bg-surface-2 text-accent rounded-bl-sm'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={handleReply} className="p-4 border-t border-border flex gap-3">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type a reply..."
                  className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-accent placeholder-accent-muted focus:outline-none focus:border-accent-dim"
                />
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="bg-accent text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send size={14} /> Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
