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

import { KokoroTTS } from 'kokoro-js'

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX'
const VOICE_MAP = { female: 'af_heart', male: 'am_michael' } as const

let ttsInstance: KokoroTTS | null = null
let loadingPromise: Promise<KokoroTTS> | null = null
let audioCtx: AudioContext | null = null
let currentSource: AudioBufferSourceNode | null = null

async function getTTS(): Promise<KokoroTTS> {
  if (ttsInstance) return ttsInstance
  if (!loadingPromise) {
    loadingPromise = KokoroTTS.from_pretrained(MODEL_ID, { dtype: 'q8', device: 'wasm' })
      .then(instance => { ttsInstance = instance; return instance })
  }
  return loadingPromise
}

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioCtx = new AC()
  }
  return audioCtx
}

// Call this during a user gesture (button tap/click) so iOS allows audio playback
export function unlockAudio(): void {
  if (typeof window === 'undefined') return
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') ctx.resume()
}

export function preloadTTS(): Promise<void> {
  return getTTS().then(() => {})
}

export function speak(text: string, gender: 'male' | 'female' = 'male', onEnd?: () => void): void {
  if (typeof window === 'undefined') return
  stopSpeaking()

  ;(async () => {
    const tts = await getTTS()
    const audio = await tts.generate(text, { voice: VOICE_MAP[gender] })
    const wavBuffer = audio.toWav()

    const ctx = getAudioContext()
    if (ctx.state === 'suspended') await ctx.resume()

    const audioBuffer = await ctx.decodeAudioData(wavBuffer)
    const source = ctx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(ctx.destination)
    currentSource = source
    source.onended = () => { currentSource = null; onEnd?.() }
    source.start()
  })().catch(err => console.error('TTS error:', err))
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
