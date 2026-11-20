import { useEffect, useState } from 'react'
import { voiceStatus, type VoiceStatus } from '../lib/api.ts'

export type ModeId = 'ln' | 'order' | 'guess' | 'spell'

const MODES: Array<{
  id: ModeId
  index: string
  tag: string
  title: string
  text: string
  locked?: boolean
}> = [
  {
    id: 'ln',
    index: '01',
    tag: 'Giọng',
    title: 'Ngọng L / N',
    text: 'Mỗi ván 20 câu, tối đa 100 điểm. Đúng ngay được 5, sai thì giảm. Sai 5 lần một câu thì câu đó mất điểm.',
  },
  {
    id: 'order',
    index: '02',
    tag: 'Coming soon',
    title: 'Xếp câu',
    text: 'Sắp mở. Kéo từ về đúng thứ tự.',
    locked: true,
  },
  {
    id: 'guess',
    index: '03',
    tag: 'Coming soon',
    title: 'Đoán nghĩa',
    text: 'Sắp mở. Đọc mô tả rồi đoán thành ngữ hoặc từ.',
    locked: true,
  },
  {
    id: 'spell',
    index: '04',
    tag: 'Coming soon',
    title: 'Chính tả',
    text: 'Sắp mở. Sửa câu ngắn đang viết sai.',
    locked: true,
  },
]

export function Home({ onPick }: { onPick: (mode: ModeId) => void }) {
  const [voice, setVoice] = useState<VoiceStatus | null>(null)

  useEffect(() => {
    let alive = true
    void voiceStatus().then((status) => {
      if (alive) setVoice(status)
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <main className="wrap home">
      <header className="brand">
        <div>
          <p className="eyebrow">Chơi cho vui</p>
          <h1>Chơi Chữ</h1>
        </div>
        <p className="lede">Trò chữ tiếng Việt. Hiện chỉ mở Ngọng L / N.</p>
      </header>

      <div className="modes">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            className={mode.locked ? 'mode-card locked' : 'mode-card'}
            type="button"
            disabled={mode.locked}
            onClick={() => {
              if (!mode.locked) onPick(mode.id)
            }}
          >
            <span className="mode-top">
              <span className="mode-index">{mode.index}</span>
              <span className="tag">{mode.tag}</span>
            </span>
            <h2>{mode.title}</h2>
            <p>{mode.text}</p>
          </button>
        ))}
      </div>

      {voice ? (
        <p className="footnote">
          {voice === 'down'
            ? 'Máy chấm giọng chưa bật. Bật backend Python rồi vào lại.'
            : voice === 'ready'
              ? 'Máy chấm giọng đã sẵn sàng.'
              : voice === 'error'
                ? 'Model giọng bị lỗi. Xem cửa sổ backend.'
                : 'Lần đọc đầu tiên máy sẽ nạp model tiếng Việt, có thể phải đợi.'}
        </p>
      ) : null}
    </main>
  )
}
