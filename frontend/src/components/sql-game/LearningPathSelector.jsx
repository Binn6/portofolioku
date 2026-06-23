import { useNavigate } from 'react-router-dom'
import { Home, Terminal, ChevronRight, Lock, Zap } from 'lucide-react'
import { useSqlGameStore } from '../../store/useSqlGameStore'

const RANK_TIERS = [
  { name: 'Script Kiddie',   color: '#666' },
  { name: 'Query Runner',    color: '#00FF41' },
  { name: 'Where Beginner',  color: '#00FF41' },
  { name: 'Filter Master',   color: '#00CC33' },
  { name: 'Sort Beginner',   color: '#00AAFF' },
  { name: 'Sort Master',     color: '#0088DD' },
  { name: 'Number Cruncher', color: '#00E5FF' },
  { name: 'Data Analyst',    color: '#00BBCC' },
  { name: 'Group Commander', color: '#AA00FF' },
  { name: 'Aggregation Pro', color: '#8800CC' },
  { name: 'Join Initiator',  color: '#FF6B00' },
  { name: 'Table Linker',    color: '#DD5500' },
  { name: 'Null Handler',    color: '#FFE500' },
  { name: 'Left Join Expert',color: '#CCBB00' },
  { name: 'Join Master',     color: '#FF0080' },
  { name: 'Index Wizard',    color: '#FF0080' },
]

export function LearningPathSelector({ chapters, subchapters, datasets, onSelect }) {
  const navigate = useNavigate()
  const { player, rank } = useSqlGameStore()

  const currentTierIdx = RANK_TIERS.findIndex(r => r.name === rank)
  const currentTier    = RANK_TIERS[currentTierIdx] ?? RANK_TIERS[0]
  const nextTier       = RANK_TIERS[currentTierIdx + 1] ?? null

  const getSubchapters = (chapterId) =>
    subchapters
      .filter(s => s.chapter_id === chapterId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const getDataset = (subchapterId) =>
    datasets.find(d => d.subchapter_id === subchapterId) ?? null

  const sortedChapters = [...chapters].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  return (
    <div className="min-h-screen bg-background text-accent" style={{ fontFamily: 'monospace' }}>

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 h-11 border-b border-border bg-surface sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-[11px] font-mono text-sql-dim hover:text-accent transition-colors"
          >
            <Home size={12} /> HOME
          </button>
          <span className="text-border">│</span>
          <div className="flex items-center gap-1.5">
            <Terminal size={12} className="text-sql-primary" />
            <span className="text-[11px] font-mono text-sql-primary tracking-widest hidden sm:block">
              SQL MISSION CONTROL
            </span>
          </div>
        </div>
        <div className="text-[10px] font-mono text-sql-dim hidden md:block">
          {player ? (
            <span>
              <span className="text-sql-primary">{player.username}</span>
              {' · '}
              <span style={{ color: currentTier.color }}>{rank}</span>
            </span>
          ) : (
            <span>GUEST · <span className="text-sql-dim">Login untuk simpan progress</span></span>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-10 pb-20">

        {/* ── Hero ───────────────────────────────────────────────────── */}
        <div className="mb-10">
          <p className="text-[10px] font-mono text-sql-dim tracking-[0.35em] mb-2">
            SYSTEM.INIT → OPERATION_SELECT
          </p>
          <h1 className="text-4xl font-mono font-black tracking-tighter mb-1">
            <span className="text-sql-primary">_</span>MISSION SELECT
          </h1>
          <p className="text-xs font-mono text-sql-dim">
            Pilih operasi untuk memulai — selesaikan misi, naikkan rank, kuasai SQL.
          </p>
        </div>

        {/* ── Rank Progression Strip ─────────────────────────────────── */}
        <div className="mb-10 border border-border rounded-xl bg-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Zap size={12} className="text-sql-primary" />
            <span className="text-[10px] font-mono text-sql-dim tracking-widest uppercase">Rank Progression</span>
            <span className="ml-auto text-[10px] font-mono" style={{ color: currentTier.color }}>
              ◆ {rank}
            </span>
          </div>
          <div className="px-4 py-3 overflow-x-auto">
            <div className="flex items-center gap-0 min-w-max">
              {RANK_TIERS.map((tier, i) => {
                const isCurrent  = i === currentTierIdx
                const isPast     = i < currentTierIdx
                const isFuture   = i > currentTierIdx
                return (
                  <div key={tier.name} className="flex items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full border transition-all"
                        style={{
                          backgroundColor: isPast ? tier.color : isCurrent ? tier.color : 'transparent',
                          borderColor: isFuture ? '#333' : tier.color,
                          boxShadow: isCurrent ? `0 0 8px ${tier.color}` : undefined,
                        }}
                      />
                      {isCurrent && (
                        <span className="text-[8px] font-mono whitespace-nowrap" style={{ color: tier.color }}>
                          ▲ YOU
                        </span>
                      )}
                    </div>
                    {i < RANK_TIERS.length - 1 && (
                      <div
                        className="w-5 h-px mx-0.5"
                        style={{ backgroundColor: isPast ? '#444' : '#222' }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
            {nextTier && (
              <p className="text-[9px] font-mono text-sql-dim mt-3">
                NEXT: <span style={{ color: nextTier.color }}>{nextTier.name}</span>
                {' — selesaikan misi berikutnya untuk naik rank'}
              </p>
            )}
          </div>
        </div>

        {/* ── Chapter Sectors ────────────────────────────────────────── */}
        <div className="space-y-8">
          {sortedChapters.map((chapter, chIdx) => {
            const subs           = getSubchapters(chapter.id)
            const color          = chapter.color || '#00FF41'
            const hasAnyDataset  = subs.some(s => getDataset(s.id))
            const isComingSoon   = !hasAnyDataset

            return (
              <section key={chapter.id}>
                {/* Sector header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[9px] font-mono tracking-[0.3em]" style={{ color: color + '99' }}>
                    SECTOR_{String(chIdx + 1).padStart(2, '0')}
                  </span>
                  <div className="h-px w-3" style={{ backgroundColor: color + '60' }} />
                  <span className="text-sm font-mono font-bold" style={{ color: isComingSoon ? '#444' : color }}>
                    {chapter.name}
                  </span>
                  <div className="flex-1 h-px" style={{ backgroundColor: isComingSoon ? '#1a1a1a' : color + '18' }} />
                  {isComingSoon && (
                    <span className="text-[9px] font-mono tracking-widest border rounded px-2 py-0.5"
                      style={{ color: '#444', borderColor: '#2a2a2a' }}>
                      COMING SOON
                    </span>
                  )}
                  {!isComingSoon && (
                    <span className="text-[9px] font-mono tracking-wider" style={{ color: color + '60' }}>
                      {subs.filter(s => getDataset(s.id)).length}/{subs.length} UNLOCKED
                    </span>
                  )}
                </div>

                {/* Stage cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {subs.map((sub, subIdx) => {
                    const dataset   = getDataset(sub.id)
                    const available = !!dataset && !isComingSoon

                    return (
                      <StageCard
                        key={sub.id}
                        sub={sub}
                        subIdx={subIdx}
                        dataset={dataset}
                        available={available}
                        isComingSoon={isComingSoon}
                        color={color}
                        onSelect={onSelect}
                      />
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StageCard({ sub, subIdx, dataset, available, isComingSoon, color, onSelect }) {
  const num = String(subIdx + 1).padStart(2, '0')

  if (isComingSoon) {
    return (
      <div className="relative rounded-lg border p-4 select-none overflow-hidden"
        style={{ borderColor: '#1e1e1e', backgroundColor: '#0d0d0d' }}>
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 4px)' }} />
        <span className="text-3xl font-black leading-none block mb-3" style={{ color: '#1e1e1e' }}>{num}</span>
        <p className="text-[10px] font-mono leading-tight" style={{ color: '#2e2e2e' }}>{sub.name}</p>
        <div className="flex items-center gap-1 mt-3">
          <Lock size={9} style={{ color: '#2e2e2e' }} />
          <span className="text-[8px] font-mono tracking-widest" style={{ color: '#2e2e2e' }}>LOCKED</span>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => available && onSelect(dataset)}
      disabled={!available}
      className="group relative text-left rounded-lg border p-4 transition-all duration-200 overflow-hidden"
      style={{
        borderColor: available ? color + '35' : '#1e1e1e',
        backgroundColor: available ? '#0f0f0f' : '#0a0a0a',
        cursor: available ? 'pointer' : 'not-allowed',
      }}
      onMouseEnter={available ? e => {
        e.currentTarget.style.borderColor = color + 'AA'
        e.currentTarget.style.backgroundColor = color + '08'
        e.currentTarget.style.boxShadow = `0 0 16px ${color}18, inset 0 0 12px ${color}06`
      } : undefined}
      onMouseLeave={available ? e => {
        e.currentTarget.style.borderColor = color + '35'
        e.currentTarget.style.backgroundColor = '#0f0f0f'
        e.currentTarget.style.boxShadow = ''
      } : undefined}
    >
      {/* Scanline texture */}
      {available && (
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 3px)' }} />
      )}

      {/* Stage number */}
      <div className="flex items-start justify-between mb-2">
        <span
          className="text-3xl font-black leading-none transition-colors duration-200"
          style={{ color: available ? color + '50' : '#1e1e1e' }}
        >
          {num}
        </span>
        {available
          ? <ChevronRight size={11} className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ color }} />
          : <Lock size={10} className="mt-1" style={{ color: '#2e2e2e' }} />
        }
      </div>

      {/* Name */}
      <p className="text-[11px] font-mono font-semibold leading-tight mb-1 transition-colors duration-200"
        style={{ color: available ? color : '#2e2e2e' }}>
        {sub.name}
      </p>

      {/* Description */}
      {sub.description && (
        <p className="text-[9px] font-mono leading-tight line-clamp-2"
          style={{ color: available ? '#555' : '#222' }}>
          {sub.description}
        </p>
      )}

      {/* Dataset label on hover */}
      {available && (
        <p className="text-[8px] font-mono tracking-wider mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ color: color + '80' }}>
          {dataset?.name?.toUpperCase()} →
        </p>
      )}
    </button>
  )
}
