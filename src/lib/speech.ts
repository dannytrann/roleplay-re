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

// Queue of Promises — each resolves to the decoded AudioBuffer when ready.
// Drain awaits each promise so it never tries to play a buffer before it exists.
const audioQueue: Promise<AudioBuffer>[] = []
let queueRunning = false

async function drainQueue(ctx: AudioContext, onAllDone?: () => void) {
  if (queueRunning) return
  queueRunning = true
  while (audioQueue.length > 0) {
    const bufPromise = audioQueue.shift()!
    try {
      const buf = await bufPromise
      if (!queueRunning) break // stopSpeaking() was called while we awaited
      if (ctx.state === 'suspended') await ctx.resume()
      await new Promise<void>(resolve => {
        const src = ctx.createBufferSource()
        src.buffer = buf
        src.connect(ctx.destination)
        currentSource = src
        src.onended = () => { currentSource = null; resolve() }
        src.start()
      })
    } catch {
      // Skip this sentence if fetch/decode failed and continue with the rest
    }
  }
  queueRunning = false
  onAllDone?.()
}

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

// Fetch TTS audio and add to the playback queue.
// Sentences are fetched in parallel but always play in the order queued.
export function speakQueued(text: string, gender: 'male' | 'female' = 'male', onAllDone?: () => void): void {
  if (typeof window === 'undefined' || !text.trim()) return

  const ctx = getAudioContext()

  const bufferPromise = fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, gender }),
  })
    .then(res => {
      if (!res.ok) throw new Error(`TTS API returned ${res.status}`)
      return res.arrayBuffer()
    })
    .then(ab => ctx.decodeAudioData(ab))

  audioQueue.push(bufferPromise)
  drainQueue(ctx, onAllDone)
}

// Simple wrapper for one-shot speak (no streaming)
export function speak(text: string, gender: 'male' | 'female' = 'male', onEnd?: () => void): void {
  stopSpeaking()
  speakQueued(text, gender, onEnd)
}

export function stopSpeaking(): void {
  audioQueue.length = 0
  queueRunning = false
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
