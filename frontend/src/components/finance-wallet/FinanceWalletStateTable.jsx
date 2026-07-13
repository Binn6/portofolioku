import { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { financeWalletGetState } from '../../services/api'
import { formatRupiah } from '../../utils/financeWallet'

const POLL_INTERVAL_MS = 5000

const FinanceWalletStateTable = forwardRef(function FinanceWalletStateTable(_props, ref) {
  const [state, setState] = useState({ accounts: [], budgets: [], transactions: [] })
  const [error, setError] = useState(null)

  const refresh = useCallback(() => {
    financeWalletGetState()
      .then(setState)
      .catch(() => setError('Gagal memuat data terbaru.'))
  }, [])

  useImperativeHandle(ref, () => ({ refresh }))

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [refresh])

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="bg-surface border border-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-accent mb-3">Saldo Rekening</h3>
        <div className="space-y-2">
          {state.accounts.map((acc) => (
            <div key={acc.nama} className="flex justify-between text-sm">
              <span className="text-accent-muted">{acc.nama}</span>
              <span className="text-accent font-medium">{formatRupiah(acc.saldo_sekarang)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-accent mb-3">Budget Kategori</h3>
        <div className="space-y-3">
          {state.budgets.map((b) => {
            const persen = b.limit_bulanan > 0
              ? Math.min(100, Math.round((b.terpakai_bulan_ini / b.limit_bulanan) * 100))
              : 0
            const barColor = persen >= 90 ? 'bg-red-500' : persen >= 80 ? 'bg-yellow-500' : 'bg-accent'
            return (
              <div key={b.kategori}>
                <div className="flex justify-between text-xs text-accent-muted mb-1">
                  <span>{b.kategori}</span>
                  <span>{formatRupiah(b.terpakai_bulan_ini)} / {formatRupiah(b.limit_bulanan)}</span>
                </div>
                <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${persen}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 md:col-span-2">
        <h3 className="text-sm font-semibold text-accent mb-3">Transaksi Terbaru</h3>
        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {state.transactions.length === 0 && (
            <p className="text-xs text-accent-muted">Belum ada transaksi. Coba kirim pesan di chat sebelah.</p>
          )}
          {state.transactions.map((tx) => (
            <div key={tx._id} className="flex justify-between text-sm border-b border-border pb-2 last:border-0">
              <div>
                <p className="text-accent">{tx.deskripsi}</p>
                <p className="text-xs text-accent-muted">{tx.kategori} · {tx.rekening} · {tx.sumber} · #{tx.visitor_tag}</p>
              </div>
              <span className={tx.tipe === 'Expense' ? 'text-red-400' : 'text-green-400'}>
                {tx.tipe === 'Expense' ? '-' : '+'}{formatRupiah(tx.jumlah)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

export default FinanceWalletStateTable
