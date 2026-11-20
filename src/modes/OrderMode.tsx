import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { PlayFrame, ResultCard } from '../components/PlayFrame.tsx'
import { orderRound, shuffle } from '../data/decks.ts'
import { strictEqual } from '../lib/compare.ts'
import { useRound } from '../lib/round.ts'

type Token = { id: string; text: string }
type Board = { bank: Token[]; placed: Token[] }
type Drag = { id: string; from: 'bank' | 'lane'; text: string; moved: boolean; x: number; y: number; pointerId: number }

function scramble(words: string[], id: string): Token[] {
  let tokens = words.map((text, index) => ({ id: `${id}-${index}`, text }))
  const original = words.join(' ')
  let guard = 0
  do {
    tokens = shuffle(tokens)
    guard += 1
  } while (tokens.map((token) => token.text).join(' ') === original && tokens.length > 1 && guard < 8)
  if (tokens.map((token) => token.text).join(' ') === original && tokens.length > 1) {
    const first = tokens[0]
    tokens[0] = tokens[1] as Token
    tokens[1] = first as Token
  }
  return tokens
}

export function OrderMode({ onHome }: { onHome: () => void }) {
  const round = useRound(orderRound)
  const [questionKey, setQuestionKey] = useState(round.key)
  const [board, setBoard] = useState<Board>(() => ({ bank: scramble(round.item.words, round.item.id), placed: [] }))
  const [note, setNote] = useState('')
  const [shake, setShake] = useState(false)
  const [hot, setHot] = useState(false)
  const [ghost, setGhost] = useState<{ text: string; x: number; y: number } | null>(null)
  const [solved, setSolved] = useState(false)
  const laneRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<Drag | null>(null)
  const timer = useRef(0)

  if (questionKey !== round.key) {
    setQuestionKey(round.key)
    setBoard({ bank: scramble(round.item.words, round.item.id), placed: [] })
    setNote('')
    setSolved(false)
    setHot(false)
  }

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function move(id: string, to: 'bank' | 'lane', index: number) {
    setBoard((prev) => {
      const token = [...prev.bank, ...prev.placed].find((item) => item.id === id)
      if (!token) return prev
      const bank = prev.bank.filter((item) => item.id !== id)
      const placed = prev.placed.filter((item) => item.id !== id)
      if (to === 'bank') bank.push(token)
      else placed.splice(Math.max(0, Math.min(index, placed.length)), 0, token)
      return { bank, placed }
    })
  }

  function indexFromPointer(x: number, ignoreId: string) {
    const lane = laneRef.current
    if (!lane) return board.placed.length
    const chips = [...lane.querySelectorAll<HTMLElement>('[data-chip]')].filter((chip) => chip.dataset.id !== ignoreId)
    for (let index = 0; index < chips.length; index += 1) {
      const rect = chips[index]?.getBoundingClientRect()
      if (!rect) continue
      if (x < rect.left + rect.width / 2) return index
    }
    return chips.length
  }

  function overLane(x: number, y: number) {
    const rect = laneRef.current?.getBoundingClientRect()
    if (!rect) return false
    return x >= rect.left - 12 && x <= rect.right + 12 && y >= rect.top - 16 && y <= rect.bottom + 16
  }

  function onDown(event: ReactPointerEvent<HTMLButtonElement>, token: Token, from: 'bank' | 'lane') {
    if (solved) return
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Pointer capture needs a real pointer. Drag still tracks move and up on the chip.
    }
    dragRef.current = {
      id: token.id,
      from,
      text: token.text,
      moved: false,
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    }
  }

  function onMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 6) drag.moved = true
    if (!drag.moved) return
    setGhost({ text: drag.text, x: event.clientX, y: event.clientY })
    setHot(overLane(event.clientX, event.clientY))
  }

  function onUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    dragRef.current = null
    setGhost(null)
    setHot(false)
    if (!drag || drag.pointerId !== event.pointerId || solved) return
    if (!drag.moved) {
      if (drag.from === 'bank') move(drag.id, 'lane', board.placed.length)
      else move(drag.id, 'bank', 0)
      return
    }
    if (overLane(event.clientX, event.clientY)) move(drag.id, 'lane', indexFromPointer(event.clientX, drag.id))
    else if (drag.from === 'lane') move(drag.id, 'bank', 0)
  }

  function check() {
    const guess = board.placed.map((token) => token.text).join(' ')
    if (strictEqual(guess, round.item.words.join(' '))) {
      setSolved(true)
      setNote('')
      timer.current = window.setTimeout(() => round.finishQuestion(true, 100), 650)
      return
    }
    setNote('Chưa đúng thứ tự.')
    setShake(true)
    window.setTimeout(() => setShake(false), 420)
  }

  function reshuffle() {
    setBoard({ bank: scramble(round.item.words, `${round.item.id}-again`), placed: [] })
    setNote('')
  }

  const handlers = (token: Token, from: 'bank' | 'lane') => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => onDown(event, token, from),
    onPointerMove: onMove,
    onPointerUp: onUp,
    onPointerCancel: onUp,
  })

  return (
    <PlayFrame
      title="Xếp câu"
      tag="Kéo thả"
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
          <p className="hint">Kéo từ lên dòng, hoặc chạm để thêm. Chạm lại một từ trên dòng để bỏ ra.</p>
          <div ref={laneRef} className={hot ? 'lane hot' : shake ? 'lane shake' : 'lane'}>
            {board.placed.length === 0 ? <span className="lane-empty">Câu của bạn</span> : null}
            {board.placed.map((token) => (
              <button key={token.id} type="button" className="chip" data-chip="" data-id={token.id} {...handlers(token, 'lane')}>
                {token.text}
              </button>
            ))}
          </div>
          <div className="bank">
            {board.bank.map((token) => (
              <button key={token.id} type="button" className="chip" data-id={token.id} {...handlers(token, 'bank')}>
                {token.text}
              </button>
            ))}
          </div>
          {solved ? <p className="banner ok">Đúng.</p> : null}
          {note ? <p className="banner bad">{note}</p> : null}
          <div className="row">
            <button className="primary" type="button" onClick={check} disabled={solved || board.placed.length !== round.item.words.length}>
              Xong
            </button>
            <button className="secondary" type="button" onClick={reshuffle} disabled={solved}>
              Trộn lại
            </button>
            <button className="text-btn" type="button" onClick={() => round.finishQuestion(false)}>
              Bỏ qua
            </button>
          </div>
        </section>
      )}
      {ghost ? (
        <div className="ghost-chip" style={{ left: ghost.x, top: ghost.y }}>
          {ghost.text}
        </div>
      ) : null}
    </PlayFrame>
  )
}
