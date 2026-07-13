import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { financeWalletSendMessage, financeWalletConfirm } from '../../services/api'
import { getOrCreateVisitorTag } from '../../utils/financeWallet'

const ACCOUNT_OPTIONS = ['Mandiri', 'BSI', 'Jago', 'Dana', 'Gopay', 'OVO']

function makeMessage(role, text, pending = null) {
  return { id: crypto.randomUUID(), role, text, pending }
}

function buildPending(payload) {
  if (payload.type === 'pending_account') {
    return { kind: 'account', pendingId: payload.pending_id, options: payload.options || ACCOUNT_OPTIONS }
  }
  if (payload.type === 'pending_category') {
    return { kind: 'yesno', pendingId: payload.pending_id }
  }
  if (payload.realokasi_suggestion) {
    return { kind: 'yesno', pendingId: payload.realokasi_suggestion.pending_id }
  }
  return null
}

export default function FinanceChatWidget({ onStateChanged }) {
  const [messages, setMessages] = useState([
    makeMessage('bot', 'Halo! Coba tulis transaksi (misal "makan siang 25rb dari mandiri") atau tanya "sisa saldo gua berapa?".'),
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const visitorTag = useRef(getOrCreateVisitorTag())
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    setMessages((prev) => [...prev, makeMessage('user', text)])
    setInput('')
    setSending(true)
    try {
      const payload = await financeWalletSendMessage({ visitor_tag: visitorTag.current, message: text })
      setMessages((prev) => [...prev, makeMessage('bot', payload.reply, buildPending(payload))])
      onStateChanged?.()
    } catch (err) {
      const reply = err?.response?.status === 429
        ? (err.response.data?.reply || 'Demo lagi ramai, coba lagi besok.')
        : 'Gagal mengirim pesan. Coba lagi.'
      setMessages((prev) => [...prev, makeMessage('bot', reply)])
    } finally {
      setSending(false)
    }
  }

  const handleConfirm = async (pendingId, action, choice) => {
    setMessages((prev) => prev.map((m) => (m.pending?.pendingId === pendingId ? { ...m, pending: null } : m)))
    setSending(true)
    try {
      const result = await financeWalletConfirm({ pending_id: pendingId, action, choice })
      setMessages((prev) => [...prev, makeMessage('bot', result.reply, buildPending(result))])
      onStateChanged?.()
    } catch {
      setMessages((prev) => [...prev, makeMessage('bot', 'Gagal memproses konfirmasi. Coba lagi.')])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col" style={{ height: 480 }}>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'bot' ? 'items-start' : 'items-end'}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                msg.role === 'bot' ? 'bg-surface-2 text-accent rounded-bl-sm' : 'bg-accent text-background rounded-br-sm'
              }`}
            >
              {msg.text}
            </div>
            {msg.pending?.kind === 'account' && (
              <div className="flex flex-wrap gap-2 mt-2">
                {msg.pending.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleConfirm(msg.pending.pendingId, 'accept', opt)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border text-accent hover:border-accent-dim"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
            {msg.pending?.kind === 'yesno' && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleConfirm(msg.pending.pendingId, 'accept')}
                  className="text-xs px-3 py-1.5 rounded-full bg-accent text-background"
                >
                  Ya
                </button>
                <button
                  onClick={() => handleConfirm(msg.pending.pendingId, 'reject')}
                  className="text-xs px-3 py-1.5 rounded-full border border-border text-accent hover:border-accent-dim"
                >
                  Gak usah
                </button>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-border">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Coba: "makan siang 25rb dari mandiri"'
          className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-accent placeholder-accent-muted focus:outline-none focus:border-accent-dim"
        />
        <button
          type="submit"
          aria-label="Kirim pesan"
          disabled={sending || !input.trim()}
          className="bg-accent text-background px-3 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </form>
    </div>
  )
}
