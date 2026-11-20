import { useEffect, useRef, useState } from 'react'
import { PlayFrame, ResultCard } from '../components/PlayFrame.tsx'
import { lnRound } from '../data/decks.ts'
import { warmupVoice, transcribe } from '../lib/api.ts'
import { micError, recordTake, type Take } from '../lib/audio.ts'
import { heardMatchesPhrase } from '../lib/compare.ts'
import { useRound } from '../lib/round.ts'

const LIMIT = 5_000
const LIVES = 5
const FIRST_POINTS = 5

type Phase = 'ready' | 'recording' | 'grading' | 'hit' | 'miss' | 'bust'

export function LnMode({ onHome }: { onHome: () => void }) {
  const round = useRound(lnRound)
  const [phase, setPhase] = useState<Phase>('ready')
  const [left, setLeft] = useState(LIMIT)
  const [heard, setHeard] = useState('')
  const [error, setError] = useState('')
  const [model, setModel] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [questionKey, setQuestionKey] = useState(round.key)
  const [strikes, setStrikes] = useState(0)
  const takeRef = useRef<Take | null>(null)
  const ticket = useRef(0)
  const timer = useRef(0)

  if (questionKey !== round.key) {
    setQuestionKey(round.key)
    setPhase('ready')
    setHeard('')
    setError('')
    setLeft(LIMIT)
    setStrikes(0)
  }

  useEffect(() => {
    let alive = true
    void warmupVoice()
      .then(() => {
        if (alive) setModel('ready')
      })
      .catch(() => {
        if (alive) setModel('failed')
      })
    return () => {
      alive = false
      ticket.current += 1
      takeRef.current?.cancel()
      window.clearTimeout(timer.current)
    }
  }, [])

  async function grade(blob: Blob, stamp: number) {
    if (stamp !== ticket.current) return
    if (blob.size < 800) {
      setPhase('ready')
      setError('Nghe quá ngắn. Đọc lại gần micro hơn.')
      return
    }
    setPhase('grading')
    try {
      const text = await transcribe(blob)
      if (stamp !== ticket.current) return
      setHeard(text)
      if (!text) {
        setPhase('ready')
        setError('Không nghe rõ câu nào. Đọc lại gần micro hơn.')
        return
      }
      if (heardMatchesPhrase(text, round.item.text)) {
        const points = FIRST_POINTS - strikes
        setPhase('hit')
        timer.current = window.setTimeout(() => {
          if (stamp === ticket.current) round.finishQuestion(true, points)
        }, 700)
      } else {
        const nextStrikes = strikes + 1
        setStrikes(nextStrikes)
        if (nextStrikes >= LIVES) {
          setPhase('bust')
          timer.current = window.setTimeout(() => {
            if (stamp === ticket.current) round.finishQuestion(false)
          }, 900)
          return
        }
        setPhase('miss')
      }
    } catch (reason) {
      if (stamp !== ticket.current) return
      setPhase('ready')
      setError(micError(reason))
    }
  }

  function begin() {
    const stamp = ticket.current
    setError('')
    setHeard('')
    setPhase('recording')
    setLeft(LIMIT)
    const take = recordTake(LIMIT, (ms) => {
      setLeft(ms)
    })
    takeRef.current = take
    void take.done
      .then((blob) => grade(blob, stamp))
      .catch((reason: unknown) => {
        if (stamp !== ticket.current) return
        setPhase('ready')
        setError(micError(reason))
      })
  }

  function stop() {
    takeRef.current?.stop()
  }

  const seconds = Math.ceil(left / 1000)
  const pointsNow = FIRST_POINTS - strikes

  return (
    <PlayFrame
      title="Ngọng L / N"
      tag="Giọng"
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
          note={round.correct === round.total ? 'Đúng cả 20 câu.' : 'Câu sai đủ 5 lần thì câu đó không có điểm.'}
        />
      ) : (
        <section className="stage">
          <p className="prompt">{round.item.text}</p>
          <p className="stake">
            <strong>{strikes === 0 ? 'Đúng ngay' : 'Đọc lại'}: {pointsNow} điểm</strong>
            <span>Còn {LIVES - strikes} lần cho câu này</span>
          </p>
          <div className="timer-row">
            <div className={seconds <= 2 && phase === 'recording' ? 'timer low' : 'timer'}>
              {phase === 'recording' ? seconds : LIMIT / 1000}
              <small>giây</small>
            </div>
            {phase === 'recording' ? (
              <button className="primary" type="button" onClick={stop}>
                Xong
              </button>
            ) : phase === 'miss' || phase === 'bust' ? null : (
              <button className="primary" type="button" onClick={begin} disabled={phase === 'grading' || phase === 'hit'}>
                {phase === 'grading' ? 'Đang chép…' : 'Đọc'}
              </button>
            )}
          </div>
          <p className="hint">
            {model === 'loading'
              ? 'Đang nạp model giọng. Lần đầu có thể mất vài phút.'
              : model === 'failed'
                ? 'Chưa nạp được model. Kiểm tra backend Python rồi vào lại mode này.'
                : 'Đúng phụ âm, kể cả l và n, là qua. Dấu thanh máy nghe lệch thì bỏ qua.'}
          </p>
          {error ? <p className="banner bad">{error}</p> : null}
          {phase === 'hit' ? <p className="banner ok">Đúng. +{pointsNow} điểm.</p> : null}
          {phase === 'miss' ? (
            <div className="banner bad">
              <p>Máy nghe được: {heard || '…'}</p>
              <p>Sai. Còn {LIVES - strikes} lần cho câu này, đọc lại được {pointsNow} điểm.</p>
              <div className="row">
                <button className="primary" type="button" onClick={begin}>
                  Đọc lại
                </button>
              </div>
            </div>
          ) : null}
          {phase === 'bust' ? <p className="banner bad">Hết 5 lần. Câu này không được điểm.</p> : null}
        </section>
      )}
    </PlayFrame>
  )
}
