import { TablePill } from '../ui/TablePill'

export function TablePills({ tables, orderingHint }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tables.map(t => <TablePill key={t}>{t}</TablePill>)}
      </div>
      {orderingHint && (
        <p className="text-xs font-mono text-sql-tertiary">{orderingHint}</p>
      )}
    </div>
  )
}
