import { useState } from 'react'

export function useRound<T extends { id: string }>(build: () => T[]) {
  const [deck, setDeck] = useState(build)
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)
  const [serial, setSerial] = useState(0)

  function finishQuestion(wasCorrect: boolean, points = 0) {
    if (wasCorrect) {
      setScore((value) => value + points)
      setCorrect((value) => value + 1)
    }
    setIndex((current) => {
      if (current + 1 >= deck.length) {
        setDone(true)
        return current
      }
      return current + 1
    })
  }

  function replay() {
    setDeck(build())
    setIndex(0)
    setScore(0)
    setCorrect(0)
    setDone(false)
    setSerial((value) => value + 1)
  }

  return {
    item: deck[index] as T,
    index,
    total: deck.length,
    score,
    correct,
    done,
    finishQuestion,
    replay,
    key: `${serial}-${deck[index]?.id ?? index}`,
  }
}
