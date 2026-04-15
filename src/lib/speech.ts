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
// Kokoro TTS (primary) with speechSynthesis fallback
// ---------------------------------------------------------------------------

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX'
const VOICE_MAP = { female: 'af_heart', male: 'am_michael' } as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ttsInstance: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let loadingPromise: Promise<any> | null = null
let audioCtx: AudioContext | null = null
let currentSource: AudioBufferSourceNode | null = null
let currentUtterance: SpeechSynthesisUtterance | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTTS(): Promise<any> {
  if (ttsInstance) return ttsInstance
  if (!loadingPromise) {
    console.log('[TTS] Starting Kokoro model download…')
    loadingPromise = import('kokoro-js')
      .then(({ KokoroTTS, env }) => {
        console.log('[TTS] kokoro-js imported, setting WASM paths…')
        env.wasmPaths = '/wasm/'
        return KokoroTTS.from_pretrained(MODEL_ID, {
          dtype: 'q8',
          device: 'wasm',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          progress_callback: (p: any) => {
            if (p.status === 'downloading') {
              const pct = p.progress ? Math.round(p.progress) : '?'
              console.log(`[TTS] Downloading model: ${p.file} — ${pct}%`)
            } else {
              console.log('[TTS] Model status:', p.status)
            }
          },
        })
      })
      .then(instance => {
        console.log('[TTS] Kokoro model ready ✓')
        ttsInstance = instance
        return instance
      })
      .catch(err => {
        console.warn('[TTS] Kokoro failed to load, will use speechSynthesis fallback:', err)
        loadingPromise = null
        throw err
      })
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

export function unlockAudio(): void {
  if (typeof window === 'undefined') return
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') ctx.resume()
}

export function preloadTTS(): Promise<void> {
  return getTTS().then(() => {}).catch(() => {})
}

function fallbackSpeak(text: string, gender: 'male' | 'female', onEnd?: () => void): void {
  if (!('speechSynthesis' in window)) return
  console.log('[TTS] Using speechSynthesis fallback')
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.pitch = gender === 'male' ? 0.9 : 1.1
  utterance.onend = () => { currentUtterance = null; onEnd?.() }
  currentUtterance = utterance
  window.speechSynthesis.speak(utterance)
}

export function speak(text: string, gender: 'male' | 'female' = 'male', onEnd?: () => void): void {
  if (typeof window === 'undefined') return
  stopSpeaking()

  ;(async () => {
    try {
      console.log('[TTS] speak() called, getting TTS instance…')
      const tts = await getTTS()
      console.log('[TTS] Generating audio…')
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
      console.log('[TTS] Kokoro audio playing ✓')
    } catch (err) {
      console.warn('[TTS] Kokoro speak failed, using fallback:', err)
      fallbackSpeak(text, gender, onEnd)
    }
  })()
}

export function stopSpeaking(): void {
  if (currentSource) {
    try { currentSource.stop() } catch { /* already stopped */ }
    currentSource = null
  }
  if (currentUtterance) {
    window.speechSynthesis.cancel()
    currentUtterance = null
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as unknown as Record<string, unknown>
  return !!(w['SpeechRecognition'] || w['webkitSpeechRecognition'])
}
