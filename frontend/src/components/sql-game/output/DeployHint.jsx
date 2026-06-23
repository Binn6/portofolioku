import { CheckCircle2, AlertTriangle } from 'lucide-react'

export function DeployHint({ deployResult }) {
  if (!deployResult) return null
  const { pass, diffs } = deployResult

  if (pass) {
    return (
      <div className="flex-shrink-0 rounded border px-4 py-2.5 flex items-center gap-3 relative overflow-hidden"
        style={{
          borderColor: 'rgba(0,255,65,0.35)',
          background: 'rgba(0,255,65,0.05)',
        }}>
        {/* Animated left bar */}
        <div className="absolute left-0 inset-y-0 w-0.5"
          style={{ background: '#00FF41', boxShadow: '0 0 8px #00FF41' }} />
        <CheckCircle2 size={16} className="flex-shrink-0"
          style={{ color: '#00FF41', filter: 'drop-shadow(0 0 5px #00FF41)' }} />
        <div>
          <p className="text-[11px] font-mono font-bold tracking-wider" style={{ color: '#00FF41' }}>
            MISI SELESAI
          </p>
          <p className="text-[10px] font-mono" style={{ color: 'rgba(0,255,65,0.55)' }}>
            Query kamu sudah benar — lanjut ke stage berikutnya
          </p>
        </div>
        <div className="ml-auto flex gap-1.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#00FF41', boxShadow: '0 0 4px #00FF41', opacity: 1 - i * 0.25 }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-shrink-0 rounded border px-4 py-2.5 relative overflow-hidden"
      style={{ borderColor: 'rgba(255,70,70,0.3)', background: 'rgba(255,30,30,0.04)' }}>
      <div className="absolute left-0 inset-y-0 w-0.5"
        style={{ background: '#FF4444', boxShadow: '0 0 6px rgba(255,70,70,0.6)' }} />
      <div className="flex items-center gap-2 mb-1.5">
        <AlertTriangle size={12} className="text-red-400 flex-shrink-0" />
        <span className="text-[11px] font-mono font-bold text-red-400 tracking-wider">VALIDASI GAGAL</span>
      </div>
      <ul className="space-y-0.5 pl-4">
        {diffs.map((d, i) => (
          <li key={i} className="text-[10px] font-mono text-red-400/70 list-disc">{d}</li>
        ))}
      </ul>
    </div>
  )
}
