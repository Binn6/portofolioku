// frontend/src/components/sql-game/leaderboard/LeaderboardTable.jsx
import { Crown, Zap } from 'lucide-react'

function formatSeconds(s) {
  if (s == null) return '—'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

export function LeaderboardTable({ rows, callerRow, type, loggedIn }) {
  if (!rows) {
    return (
      <div className="flex items-center justify-center h-32 text-sql-dim text-xs font-mono">
        LOADING...
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sql-dim text-xs font-mono">
        Belum ada data leaderboard untuk dataset ini.
      </div>
    )
  }

  const rankIcon = (rank) => {
    if (rank === 1) return <Crown size={12} className="text-yellow-400" />
    if (rank === 2) return <Crown size={12} className="text-[#aaa]" />
    if (rank === 3) return <Crown size={12} className="text-amber-600" />
    return <span className="text-sql-dim">{rank}</span>
  }

  const Row = ({ item, separator }) => (
    <>
      {separator && (
        <tr>
          <td colSpan={4} className="py-1 px-3">
            <div className="border-t border-dashed border-border" />
          </td>
        </tr>
      )}
      <tr className={item.is_me ? 'bg-sql-primary/10' : 'hover:bg-surface'}>
        <td className="py-2 px-3 text-center w-10">{rankIcon(item.rank)}</td>
        <td className={`py-2 px-3 font-mono text-sm ${item.is_me ? 'text-sql-primary font-semibold' : 'text-accent'}`}>
          {item.username}
          {item.is_me && <span className="ml-2 text-xs text-sql-dim">(kamu)</span>}
        </td>
        <td className="py-2 px-3 text-right font-mono text-sm text-sql-primary">
          {type === 'xp'
            ? <span>{item.xp?.toLocaleString()} <span className="text-sql-dim text-xs">XP</span></span>
            : <span className="flex items-center justify-end gap-1">
                <Zap size={11} className="text-yellow-400" />{formatSeconds(item.total_seconds)}
              </span>
          }
        </td>
        <td className="py-2 px-3 text-right text-xs text-sql-dim font-mono">
          {item.solved_count} misi
        </td>
      </tr>
    </>
  )

  return (
    <div className="overflow-y-auto flex-1">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2 px-3 text-xs text-sql-dim font-mono text-center w-10">#</th>
            <th className="py-2 px-3 text-xs text-sql-dim font-mono text-left">PLAYER</th>
            <th className="py-2 px-3 text-xs text-sql-dim font-mono text-right">
              {type === 'xp' ? 'XP' : 'WAKTU'}
            </th>
            <th className="py-2 px-3 text-xs text-sql-dim font-mono text-right">MISI</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => <Row key={r.rank} item={r} />)}
          {callerRow && <Row item={callerRow} separator />}
        </tbody>
      </table>
      {!loggedIn && (
        <p className="text-center text-xs text-sql-dim font-mono py-4 border-t border-border">
          Login untuk lihat posisi kamu
        </p>
      )}
    </div>
  )
}
