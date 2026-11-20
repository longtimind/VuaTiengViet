import { useState } from 'react'
import { Home, type ModeId } from './modes/Home.tsx'
import { LnMode } from './modes/LnMode.tsx'

export default function App() {
  const [mode, setMode] = useState<ModeId | null>(null)

  if (mode === 'ln') return <LnMode onHome={() => setMode(null)} />
  return <Home onPick={setMode} />
}
