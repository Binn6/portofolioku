import { User } from 'lucide-react'

export function UserCard({ rank, player }) {
  return (
    <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
      <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
        <User size={16} className="text-accent-muted" />
      </div>
      <div>
        <p className="text-xs font-mono text-accent">
          {player ? player.username : 'GUEST'}
        </p>
        <p className="text-xs font-mono text-sql-secondary">Rank: {rank}</p>
      </div>
    </div>
  )
}
