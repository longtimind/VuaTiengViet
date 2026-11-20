import type { ReactNode } from 'react'

export function PlayFrame({
  title,
  tag,
  index,
  total,
  score,
  onHome,
  children,
}: {
  title: string
  tag: string
  index: number
  total: number
  score: number
  onHome: () => void
  children: ReactNode
}) {
  return (
    <main className="wrap play">
      <header className="play-bar">
        <button className="text-btn" type="button" onClick={onHome}>
          Về nhà
        </button>
        <div className="play-title">
          <p className="eyebrow">{tag}</p>
          <h1>{title}</h1>
        </div>
        <div className="score">
          <strong>{score}</strong>
          <span>
            {Math.min(index + 1, total)}/{total}
          </span>
        </div>
      </header>
      {children}
    </main>
  )
}

export function ResultCard({
  correct,
  total,
  score,
  onReplay,
  onHome,
  eyebrow = 'Hết ván',
  note,
}: {
  correct: number
  total: number
  score: number
  onReplay: () => void
  onHome: () => void
  eyebrow?: string
  note?: string
}) {
  return (
    <section className="result">
      <p className="eyebrow">{eyebrow}</p>
      <h2>
        {correct}/{total}
      </h2>
      <p className="result-score">{score} điểm</p>
      {note ? <p className="hint">{note}</p> : null}
      <div className="row">
        <button className="primary" type="button" onClick={onReplay}>
          Chơi lại
        </button>
        <button className="secondary" type="button" onClick={onHome}>
          Về nhà
        </button>
      </div>
    </section>
  )
}
