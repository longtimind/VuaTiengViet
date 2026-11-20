import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { PlayFrame, ResultCard } from '../components/PlayFrame.tsx'
import { guessRound, syllableCount } from '../data/decks.ts'
import { transcribe, warmupVoice } from '../lib/api.ts'
import { micError, recordTake, type Take } from '../lib/audio.ts'
import { matchesAny } from '../lib/compare.ts'
import { useRound } from '../lib/round.ts'

const LIMIT = 8_000
type Phase = 'play' | 'recording' | 'grading' | 'hit' | 'miss'

export function GuessMode({ onHome }: { onHome: () => void }) {
  const round = useRound(guessRound)
  const [value, setValue] = useState('')
  const [phase, setPhase] = useState<Phase>('play')
  const [heard, setHeard] = useState('')
  const [note, setNote] = useState('')
  const [questionKey, setQuestionKey] = useState(round.key)
  const takeRef = useRef<Take | null>(null)
  const timer = useRef(0)
  const ticket = useRef(0)

  if (questionKey !== round.key) {
    setQuestionKey(round.key)
    setValue('')
    setHeard('')
    setNote('')
    setPhase('play')
  }

  useEffect(() => {
    void warmupVoice().catch(() => {})
    return () => {
      ticket.current += 1
      takeRef.current?.cancel()
      window.clearTimeout(timer.current)
    }
  }, [])

  function judge(text: string) {
    if (matchesAny(text, round.item.answers)) {
      setPhase('hit')
      timer.current = window.setTimeout(() => round.finishQuestion(true, 100), 700)
      return
    }
    setPhase('miss')
  }

  function submit() {
    const text = value.trim()
    if (!text || phase === 'hit' || phase === 'grading' || phase === 'recording') return
    setHeard('')
    judge(text)
  }

  function listen() {
    const stamp = ticket.current
    setNote('')
    setPhase('recording')
    const take = recordTake(LIMIT, () => {})
    takeRef.current = take
    void take.done
      .then(async (blob) => {
        if (stamp !== ticket.current) return
        if (blob.size < 800) {
          setPhase('play')
          setNote('Chưa nghe rõ. Nói lại, hoặc gõ.')
          return
        }
        setPhase('grading')
        const text = await transcribe(blob)
        if (stamp !== ticket.current) return
        setValue(text)
        setHeard(text)
        if (!text) {
          setPhase('play')
          setNote('Không nghe rõ. Gõ đáp án vậy.')
          return
        }
        if (matchesAny(text, round.item.answers)) judge(text)
        else {
          setPhase('play')
          setNote('Máy đã điền chữ. Sửa nếu cần rồi bấm Đoán.')
        }
      })
      .catch((reason: unknown) => {
        if (stamp !== ticket.current) return
        setPhase('play')
        setNote(micError(reason))
      })
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  const answer = round.item.answers[0] ?? ''

  return (
    <PlayFrame
      title="Đoán nghĩa"
      tag="Gõ hoặc nói"
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
          <p className="tag">{round.item.kind}</p>
          <p className="prompt prompt-small">{round.item.prompt}</p>
          <p className="hint">{syllableCount(answer)} tiếng</p>
          <div className="answer-row">
            <input
              className="answer"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Gõ đáp án"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={phase === 'hit' || phase === 'miss'}
              aria-label="Đáp án"
            />
            <button
              className={phase === 'recording' ? 'mic on' : 'mic'}
              type="button"
              onClick={phase === 'recording' ? () => takeRef.current?.stop() : listen}
              disabled={phase === 'grading' || phase === 'hit' || phase === 'miss'}
            >
              {phase === 'recording' ? 'Dừng' : phase === 'grading' ? '…' : 'Nói'}
            </button>
          </div>
          <div className="row">
            <button className="primary" type="button" onClick={submit} disabled={!value.trim() || phase === 'hit' || phase === 'miss'}>
              Đoán
            </button>
            {phase === 'miss' ? (
              <button className="secondary" type="button" onClick={() => round.finishQuestion(false)}>
                Câu sau
              </button>
            ) : null}
          </div>
          {note ? <p className="banner bad">{note}</p> : null}
          {phase === 'hit' ? <p className="banner ok">Đúng.</p> : null}
          {phase === 'miss' ? (
            <p className="banner bad">
              {heard ? `Máy nghe được: ${heard}. ` : null}
              Đáp án: {answer}
            </p>
          ) : null}
        </section>
      )}
    </PlayFrame>
  )
}
