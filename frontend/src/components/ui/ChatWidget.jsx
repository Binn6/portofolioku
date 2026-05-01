import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send } from 'lucide-react'
import { chatSend, chatPoll } from '../../services/api'

const SESSION_KEY = 'chat_session_id'
const META_KEY = 'chat_session_meta'

function getOrCreateSession() {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

function getSessionMeta() {
  try { return JSON.parse(localStorage.getItem(META_KEY)) } catch { return null }
}

function setSessionMeta(meta) {
  localStorage.setItem(META_KEY, JSON.stringify(meta))
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState('intro') // 'intro' | 'chat'
  const [form, setForm] = useState({ name: '', email: '' })
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [unread, setUnread] = useState(0)
  const sessionId = useRef(getOrCreateSession())
  const bottomRef = useRef(null)

  // Restore session on mount
  useEffect(() => {
    const meta = getSessionMeta()
    if (meta) {
      setForm(meta)
      setPhase('chat')
    }
  }, [])

  // Poll for messages when chat is open and active
  useEffect(() => {
    if (phase !== 'chat') return
    const poll = async () => {
      try {
        const { data } = await chatPoll(sessionId.current)
        setMessages(data)
        if (!open) {
          const newFromAdmin = data.filter((m) => m.sender === 'admin' && !m.is_read)
          setUnread(newFromAdmin.length)
        }
      } catch {}
    }
    poll()
    const id = setInterval(poll, 3000)
    return () => clearInterval(id)
  }, [phase, open])

  // Clear unread when user opens chat
  useEffect(() => {
    if (open) setUnread(0)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const handleStart = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    setSessionMeta(form)
    setPhase('chat')
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || sending) return
    setSending(true)
    setError(null)
    try {
      await chatSend({
        session_id: sessionId.current,
        name: form.name,
        email: form.email,
        message: input.trim(),
      })
      setInput('')
      const { data } = await chatPoll(sessionId.current)
      setMessages(data)
    } catch {
      setError('Failed to send. Try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[90] flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="w-80 bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{ height: 440 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-2">
              <div>
                <p className="text-sm font-semibold text-accent">Live Chat</p>
                <p className="text-xs text-accent-muted">We'll reply as soon as possible</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-accent-muted hover:text-accent">
                <X size={16} />
              </button>
            </div>

            {phase === 'intro' ? (
              <form onSubmit={handleStart} className="flex-1 flex flex-col justify-center gap-4 px-5 py-6">
                <p className="text-sm text-accent-muted text-center">Introduce yourself to start chatting</p>
                <div>
                  <label className="block text-xs text-accent-muted mb-1">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    placeholder="Your name"
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-accent placeholder-accent-muted focus:outline-none focus:border-accent-dim"
                  />
                </div>
                <div>
                  <label className="block text-xs text-accent-muted mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                    placeholder="your@email.com"
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-accent placeholder-accent-muted focus:outline-none focus:border-accent-dim"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-accent text-background py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-opacity"
                >
                  Start Chat
                </button>
              </form>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
                  {messages.length === 0 && (
                    <p className="text-xs text-accent-muted text-center mt-4">
                      Send your first message — we'll reply shortly.
                    </p>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`flex ${msg.sender === 'admin' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          msg.sender === 'admin'
                            ? 'bg-surface-2 text-accent rounded-bl-sm'
                            : 'bg-accent text-background rounded-br-sm'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                {error && <p className="text-xs text-red-400 px-4 pb-1">{error}</p>}
                <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-border">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-accent placeholder-accent-muted focus:outline-none focus:border-accent-dim"
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="bg-accent text-background px-3 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="relative w-14 h-14 bg-accent text-background rounded-full shadow-xl flex items-center justify-center"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X size={22} /></motion.span>
            : <motion.span key="msg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><MessageCircle size={22} /></motion.span>
          }
        </AnimatePresence>
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unread}
          </span>
        )}
      </motion.button>
    </div>
  )
}
