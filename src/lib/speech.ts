'use client'

// Minimal interfaces to avoid DOM type availability issues
export interface SpeechRecognitionResult {
  isFinal: boolean
  0: { transcript: string }
}

export interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResult[]
}

export interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: unknown) => void) | null
  onend: (() => void) | null
}

export function createSpeechRecognition(): SpeechRecognitionInstance | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, new () => SpeechRecognitionInstance>
  const SpeechRec = w['SpeechRecognition'] || w['webkitSpeechRecognition']
  if (!SpeechRec) return null
  const recognition = new SpeechRec()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = 'en-US'
  return recognition
}

// ---------------------------------------------------------------------------
// TTS — calls /api/tts (server-side Kokoro), plays via AudioContext
// ---------------------------------------------------------------------------

let audioCtx: AudioContext | null = null
let currentSource: AudioBufferSourceNode | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioCtx = new AC()
  }
  return audioCtx
}

// Call during a user gesture so iOS allows audio playback.
// iOS Safari requires actually scheduling a buffer (not just resume()) to unlock.
export function unlockAudio(): void {
  if (typeof window === 'undefined') return
  const ctx = getAudioContext()
  const doUnlock = () => {
    const silent = ctx.createBuffer(1, 1, 22050)
    const src = ctx.createBufferSource()
    src.buffer = silent
    src.connect(ctx.destination)
    src.start(0)
  }
  if (ctx.state === 'suspended') {
    ctx.resume().then(doUnlock)
  } else {
    doUnlock()
  }
}

// No-op: model warms up on the server on first request
export function preloadTTS(): Promise<void> {
  return Promise.resolve()
}

export function speak(text: string, gender: 'male' | 'female' = 'male', onEnd?: () => void): void {
  if (typeof window === 'undefined') return
  stopSpeaking()

  ;(async () => {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, gender }),
    })

    if (!res.ok) throw new Error(`TTS API returned ${res.status}`)

    const arrayBuffer = await res.arrayBuffer()
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') await ctx.resume()

    const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
    const source = ctx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(ctx.destination)
    currentSource = source
    source.onended = () => { currentSource = null; onEnd?.() }
    source.start()
  })().catch(err => console.error('[TTS] speak error:', err))
}

export function stopSpeaking(): void {
  if (currentSource) {
    try { currentSource.stop() } catch { /* already stopped */ }
    currentSource = null
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as unknown as Record<string, unknown>
  return !!(w['SpeechRecognition'] || w['webkitSpeechRecognition'])
}
