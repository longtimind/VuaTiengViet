import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { PlayFrame, ResultCard } from '../components/PlayFrame.tsx'
import { spellRound } from '../data/decks.ts'
import { strictEqual } from '../lib/compare.ts'
import { useRound } from '../lib/round.ts'

type Phase = 'play' | 'hit' | 'miss'

export function SpellingMode({ onHome }: { onHome: () => void }) {
  const round = useRound(spellRound)
  const [value, setValue] = useState('')
  const [phase, setPhase] = useState<Phase>('play')
  const [questionKey, setQuestionKey] = useState(round.key)
  const timer = useRef(0)

  if (questionKey !== round.key) {
    setQuestionKey(round.key)
    setValue('')
    setPhase('play')
  }

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function submit() {
    const text = value.trim()
    if (!text || phase !== 'play') return
    if (strictEqual(text, round.item.right)) {
      setPhase('hit')
      timer.current = window.setTimeout(() => round.finishQuestion(true, 100), 650)
      return
    }
    setPhase('miss')
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <PlayFrame
      title="Chính tả"
      tag="Gõ"
      index={round.index}
      total={round.total}
      score={round.score}
      onHome={onHome}
    >
      {round.done ? (
        <ResultCard
          correct={round.correct}
          total={round.total}
          score={round.score}
          onReplay={round.replay}
          onHome={onHome}
        />
      ) : (
        <section className="stage">
          <p className="hint">Câu này đang sai. Gõ lại cả câu cho đúng. Không đọc micro.</p>
          <p className="prompt prompt-small wrong-line">{round.item.wrong}</p>
          <input
            className="answer"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Gõ câu đúng"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            disabled={phase !== 'play'}
            aria-label="Câu đúng"
          />
          <div className="row">
            <button className="primary" type="button" onClick={submit} disabled={!value.trim() || phase !== 'play'}>
              Xong
            </button>
            {phase === 'miss' ? (
              <button className="secondary" type="button" onClick={() => round.finishQuestion(false)}>
                Câu sau
              </button>
            ) : null}
          </div>
          {phase === 'hit' ? <p className="banner ok">Đúng.</p> : null}
          {phase === 'miss' ? <p className="banner bad">Đúng ra là: {round.item.right}</p> : null}
        </section>
      )}
    </PlayFrame>
  )
}
