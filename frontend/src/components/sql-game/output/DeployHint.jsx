import { CheckCircle, XCircle } from 'lucide-react'

export function DeployHint({ deployResult }) {
  if (!deployResult) return null
  const { pass, diffs } = deployResult

  if (pass) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded border border-sql-primary/40 bg-sql-primary/10 text-xs font-mono text-sql-primary flex-shrink-0">
        <CheckCircle size={12} />
        <span>Misi selesai! Query kamu sudah benar.</span>
      </div>
    )
  }

  return (
    <div className="px-3 py-2 rounded border border-red-500/40 bg-red-500/10 flex-shrink-0">
      <div className="flex items-center gap-2 text-xs font-mono text-red-400 mb-1.5">
        <XCircle size={12} />
        <span>Query belum sesuai. Perbaiki berdasarkan hint berikut:</span>
      </div>
      <ul className="pl-5 space-y-0.5">
        {diffs.map((d, i) => (
          <li key={i} className="text-xs font-mono text-red-400/80 list-disc">{d}</li>
        ))}
      </ul>
    </div>
  )
}
