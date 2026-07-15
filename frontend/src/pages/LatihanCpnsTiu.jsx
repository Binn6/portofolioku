import { useState } from 'react'
import { tiuQuestions } from '../data/tiuQuestions'

function ImageGroup({ src, alt, count = 1 }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <img key={i} src={src} alt={i === 0 ? alt : ''} width={28} height={28} loading="lazy" />
      ))}
    </div>
  )
}

export default function LatihanCpnsTiu() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})

  const question = tiuQuestions[currentIndex]
  const answer = answers[question.id] || { selectedIndex: null, checked: false }

  const selectOption = (optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: { selectedIndex: optionIndex, checked: false },
    }))
  }

  const checkAnswer = () => {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: { ...prev[question.id], checked: true },
    }))
  }

  const goTo = (index) => {
    if (index >= 0 && index < tiuQuestions.length) setCurrentIndex(index)
  }

  return (
    <div className="min-h-screen bg-background text-accent font-mono px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6">
          <p className="text-sql-primary text-xs tracking-widest uppercase mb-2">
            LATIHAN TIU · CPNS
          </p>
          <p className="text-accent-muted text-sm">
            Soal {currentIndex + 1}/{tiuQuestions.length}
          </p>
          <div className="h-1 bg-surface-2 rounded mt-2">
            <div
              className="h-1 bg-sql-primary rounded"
              style={{ width: `${((currentIndex + 1) / tiuQuestions.length) * 100}%` }}
            />
          </div>
        </header>

        <div className="border border-border rounded-xl bg-surface p-5">
          <span className="inline-block text-xs px-2 py-1 rounded-full border border-sql-secondary/40 text-sql-secondary mb-4">
            {question.category}
          </span>

          {question.stemImages && (
            <div className="flex flex-wrap gap-4 mb-4">
              {question.stemImages.map((group) => (
                <div key={group.label} className="text-center">
                  <ImageGroup src={group.src} alt={group.alt} count={group.count} />
                  <p className="text-accent-dim text-xs mt-1">{group.label}</p>
                </div>
              ))}
            </div>
          )}

          <p className="text-accent mb-5">{question.stem}</p>

          <div className="flex flex-col gap-2">
            {question.options.map((option, i) => {
              const isSelected = answer.selectedIndex === i
              const isCorrect = i === question.correctIndex
              let stateClass = 'border-border hover:border-sql-secondary/60'
              if (answer.checked) {
                if (isCorrect) stateClass = 'border-sql-primary bg-sql-primary/10'
                else if (isSelected) stateClass = 'border-red-500 bg-red-500/10'
              } else if (isSelected) {
                stateClass = 'border-sql-secondary'
              }

              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => selectOption(i)}
                  className={`w-full text-left border rounded-lg p-3 flex items-center gap-3 ${stateClass}`}
                >
                  <span className="text-sql-dim">{option.label}.</span>
                  {option.image ? (
                    <ImageGroup src={option.image.src} alt={option.image.alt} count={option.image.count} />
                  ) : (
                    <span>{option.text}</span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between mt-5">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => goTo(currentIndex - 1)}
              className="px-3 py-2 rounded-lg border border-border text-accent-muted disabled:opacity-30 disabled:cursor-not-allowed hover:border-accent-dim"
            >
              ◀ Soal Sebelumnya
            </button>

            <button
              type="button"
              disabled={answer.selectedIndex === null}
              onClick={checkAnswer}
              className="px-4 py-2 rounded-lg border border-sql-primary/40 text-sql-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sql-primary/10"
            >
              Cek Jawaban
            </button>

            <button
              type="button"
              disabled={currentIndex === tiuQuestions.length - 1}
              onClick={() => goTo(currentIndex + 1)}
              className="px-3 py-2 rounded-lg border border-border text-accent-muted disabled:opacity-30 disabled:cursor-not-allowed hover:border-accent-dim"
            >
              Soal Berikutnya ▶
            </button>
          </div>

          {answer.checked && (
            <div className="mt-4 border border-sql-primary/40 rounded-lg p-4 text-sm text-accent-muted">
              <p className="text-sql-primary font-mono text-xs uppercase mb-1">Pembahasan</p>
              <p>{question.explanation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
