import { useState } from 'react'
import { ChevronRight, ChevronDown, Lock, BookOpen } from 'lucide-react'

export function LearningPathSelector({ chapters, subchapters, datasets, onSelect }) {
  const [openChapters, setOpenChapters] = useState(
    chapters.length > 0 ? { [chapters[0].id]: true } : {}
  )

  const toggle = (id) => setOpenChapters(p => ({ ...p, [id]: !p[id] }))

  const getSubchapters = (chapterId) =>
    subchapters
      .filter(s => s.chapter_id === chapterId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const getDataset = (subchapterId) =>
    datasets.find(d => d.subchapter_id === subchapterId) ?? null

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 md:p-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <p className="text-sql-primary font-mono text-xs tracking-[0.3em] uppercase mb-3">
            ▶ SQL MISSION CONTROL
          </p>
          <h1 className="text-2xl font-display font-bold text-accent">LEARNING PATH</h1>
          <p className="text-accent-muted font-mono text-sm mt-2">
            Pilih modul pembelajaran untuk memulai
          </p>
        </div>

        <div className="space-y-2">
          {chapters
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map(chapter => {
              const subs = getSubchapters(chapter.id)
              const isOpen = !!openChapters[chapter.id]
              const color = chapter.color || '#00FF41'

              return (
                <div
                  key={chapter.id}
                  className="border border-border rounded-xl overflow-hidden"
                  style={isOpen ? { borderColor: color + '40' } : undefined}
                >
                  {/* Chapter header */}
                  <button
                    onClick={() => toggle(chapter.id)}
                    className="w-full flex items-center gap-3 p-4 text-left bg-surface hover:bg-surface-2 transition-colors"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: color,
                        boxShadow: isOpen ? `0 0 8px ${color}80` : undefined,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-accent font-mono font-semibold text-sm">{chapter.name}</p>
                      {chapter.description && (
                        <p className="text-xs text-accent-muted mt-0.5 line-clamp-1">
                          {chapter.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-mono text-accent-muted mr-1">
                      {subs.length} sub-bab
                    </span>
                    {isOpen
                      ? <ChevronDown size={15} className="text-accent-muted flex-shrink-0" />
                      : <ChevronRight size={15} className="text-accent-muted flex-shrink-0" />
                    }
                  </button>

                  {/* Subchapters */}
                  {isOpen && (
                    <div className="border-t divide-y" style={{ borderColor: color + '20' }}>
                      {subs.map(sub => {
                        const dataset = getDataset(sub.id)
                        const available = !!dataset

                        return (
                          <button
                            key={sub.id}
                            onClick={() => available && onSelect(dataset)}
                            disabled={!available}
                            className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                              available
                                ? 'hover:bg-surface-2 cursor-pointer group'
                                : 'opacity-40 cursor-not-allowed'
                            }`}
                          >
                            {available
                              ? <BookOpen size={13} className="flex-shrink-0" style={{ color }} />
                              : <Lock size={13} className="text-accent-muted flex-shrink-0" />
                            }
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-mono transition-colors"
                                style={available ? undefined : undefined}
                              >
                                {available ? (
                                  <span style={{ color }}>{sub.name}</span>
                                ) : (
                                  <span className="text-accent-muted">{sub.name}</span>
                                )}
                              </p>
                              {sub.description && (
                                <p className="text-xs text-accent-muted mt-0.5 line-clamp-1">
                                  {sub.description}
                                </p>
                              )}
                            </div>
                            {available && (
                              <span className="text-xs font-mono text-accent-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                {dataset.name} →
                              </span>
                            )}
                            {!available && (
                              <span className="text-[10px] font-mono text-accent-muted flex-shrink-0 px-1.5 py-0.5 border border-border rounded">
                                Segera
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
