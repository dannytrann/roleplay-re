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
  recognition.continuous = false
  recognition.interimResults = true
  recognition.lang = 'en-US'
  return recognition
}

const MALE_KEYWORDS = ['male', 'david', 'mark', 'guy', 'man', 'james', 'daniel', 'tom', 'ryan', 'eric', 'fred', 'junior', 'reed', 'rock']
const FEMALE_KEYWORDS = ['female', 'zira', 'samantha', 'victoria', 'karen', 'moira', 'susan', 'fiona', 'woman', 'girl']

function pickVoice(gender: 'male' | 'female'): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  const enVoices = voices.filter(v => v.lang.startsWith('en'))
  const keywords = gender === 'male' ? MALE_KEYWORDS : FEMALE_KEYWORDS

  // Prefer natural/neural quality voices matching the gender
  const natural = enVoices.find(v =>
    keywords.some(k => v.name.toLowerCase().includes(k)) &&
    (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Premium'))
  )
  if (natural) return natural

  // Fall back to any voice matching gender keywords
  const match = enVoices.find(v => keywords.some(k => v.name.toLowerCase().includes(k)))
  if (match) return match

  // Last resort: first English voice
  return enVoices[0] ?? null
}

export function speak(text: string, gender: 'male' | 'female' = 'male', onEnd?: () => void): void {
  if (typeof window === 'undefined') return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 1.0
  utterance.pitch = gender === 'male' ? 0.85 : 1.1
  utterance.volume = 1.0

  // Voices load async — wait briefly if empty
  const trySetVoice = () => {
    const voice = pickVoice(gender)
    if (voice) utterance.voice = voice
    if (onEnd) utterance.onend = onEnd
    window.speechSynthesis.speak(utterance)
  }

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null
      trySetVoice()
    }
  } else {
    trySetVoice()
  }
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined') return
  window.speechSynthesis.cancel()
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as unknown as Record<string, unknown>
  return !!(w['SpeechRecognition'] || w['webkitSpeechRecognition'])
}
