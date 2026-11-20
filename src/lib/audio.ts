export type Take = {
  done: Promise<Blob>
  stop: () => void
  cancel: () => void
}

type Captured = { samples: Float32Array; rate: number }

function merge(chunks: Float32Array[]): Float32Array {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const merged = new Float32Array(length)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.length
  }
  return merged
}

function downsample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return input
  const length = Math.max(1, Math.round((input.length * toRate) / fromRate))
  const output = new Float32Array(length)
  const scale = (input.length - 1) / Math.max(1, length - 1)
  for (let index = 0; index < length; index += 1) {
    const position = index * scale
    const left = Math.floor(position)
    const right = Math.min(input.length - 1, left + 1)
    const mix = position - left
    output[index] = (input[left] ?? 0) * (1 - mix) + (input[right] ?? 0) * mix
  }
  return output
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const write = (offset: number, text: string) => {
    for (let index = 0; index < text.length; index += 1) view.setUint8(offset + index, text.charCodeAt(index))
  }
  write(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  write(36, 'data')
  view.setUint32(40, samples.length * 2, true)
  let offset = 44
  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample))
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true)
    offset += 2
  }
  return new Blob([buffer], { type: 'audio/wav' })
}

export function recordTake(maxMs: number, onTick: (msLeft: number) => void): Take {
  let resolve: (blob: Blob) => void = () => {}
  let reject: (reason: unknown) => void = () => {}
  const done = new Promise<Blob>((res, rej) => {
    resolve = res
    reject = rej
  })

  let settled = false
  let action: 'stop' | 'cancel' | null = null
  let cleanup: (() => Promise<Captured>) | null = null
  let ticker = 0
  let timer = 0

  const clearTimers = () => {
    window.clearInterval(ticker)
    window.clearTimeout(timer)
  }

  const finishWith = (blob: Blob) => {
    if (settled) return
    settled = true
    clearTimers()
    resolve(blob)
  }

  const fail = (error: unknown) => {
    if (settled) return
    settled = true
    clearTimers()
    reject(error)
  }

  const runAction = () => {
    if (!cleanup || settled) return
    const closing = cleanup
    cleanup = null
    void closing()
      .then(({ samples, rate }) => {
        if (action === 'cancel') finishWith(new Blob())
        else finishWith(encodeWav(downsample(samples, rate, 16000), 16000))
      })
      .catch(fail)
  }

  void (async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
      })
      if (action === 'cancel') {
        stream.getTracks().forEach((track) => track.stop())
        finishWith(new Blob())
        return
      }
      const context = new AudioContext()
      await context.resume()
      if (typeof context.createScriptProcessor !== 'function') {
        stream.getTracks().forEach((track) => track.stop())
        await context.close()
        throw new Error('Trình duyệt này không thu được tiếng. Hãy mở bằng Chrome hoặc Edge.')
      }
      const source = context.createMediaStreamSource(stream)
      const processor = context.createScriptProcessor(4096, 1, 1)
      const gain = context.createGain()
      gain.gain.value = 0
      const chunks: Float32Array[] = []
      processor.onaudioprocess = (event) => {
        chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)))
      }
      source.connect(processor)
      processor.connect(gain)
      gain.connect(context.destination)

      const startedAt = performance.now()
      ticker = window.setInterval(() => {
        onTick(Math.max(0, maxMs - (performance.now() - startedAt)))
      }, 80)
      timer = window.setTimeout(() => {
        action = action ?? 'stop'
        runAction()
      }, maxMs)

      cleanup = async () => {
        processor.onaudioprocess = null
        processor.disconnect()
        source.disconnect()
        gain.disconnect()
        stream.getTracks().forEach((track) => track.stop())
        const rate = context.sampleRate
        const samples = merge(chunks)
        if (context.state !== 'closed') await context.close()
        return { samples, rate }
      }
      if (action) runAction()
    } catch (error) {
      fail(error)
    }
  })()

  return {
    done,
    stop: () => {
      action = action ?? 'stop'
      runAction()
    },
    cancel: () => {
      action = 'cancel'
      runAction()
    },
  }
}

export function micError(error: unknown): string {
  if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')) {
    return 'Trình duyệt đang chặn micro. Hãy cho phép micro rồi thử lại.'
  }
  if (error instanceof TypeError) return 'Máy chấm giọng chưa chạy. Bật backend Python rồi thử lại.'
  if (error instanceof Error && error.message) return error.message
  return 'Không mở được micro.'
}
