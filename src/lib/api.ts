export type VoiceStatus = 'down' | 'idle' | 'ready' | 'error'

export async function voiceStatus(): Promise<VoiceStatus> {
  try {
    const response = await fetch('/api/health')
    if (!response.ok) return 'down'
    const data = (await response.json()) as { ready?: boolean; error?: string | null }
    if (data.error) return 'error'
    return data.ready ? 'ready' : 'idle'
  } catch {
    return 'down'
  }
}

export async function warmupVoice(): Promise<void> {
  const response = await fetch('/api/warmup', { method: 'POST' })
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { detail?: string }
    throw new Error(data.detail || 'Không nạp được model giọng')
  }
}

export async function transcribe(blob: Blob): Promise<string> {
  const body = new FormData()
  body.append('file', blob, 'speech.wav')
  const response = await fetch('/api/transcribe', { method: 'POST', body })
  const data = (await response.json().catch(() => ({}))) as { text?: string; detail?: string }
  if (!response.ok) throw new Error(data.detail || 'Không chép được lời')
  return (data.text ?? '').trim()
}
