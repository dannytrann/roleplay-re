'use client'

import { useState, useRef, useEffect } from 'react'
import {
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  SpeechRecognitionInstance,
  SpeechRecognitionEvent,
} from '@/lib/speech'

interface VoiceButtonProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export default function VoiceButton({ onTranscript, disabled }: VoiceButtonProps) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const [interim, setInterim] = useState('')
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const accumulatedRef = useRef<string>('')  // all finalized text
  const interimRef = useRef<string>('')      // current unfinalized text

  useEffect(() => {
    setSupported(isSpeechRecognitionSupported())
  }, [])

  function startListening() {
    const recognition = createSpeechRecognition()
    if (!recognition) return
    recognitionRef.current = recognition
    accumulatedRef.current = ''
    interimRef.current = ''
    setListening(true)
    setInterim('')

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let currentInterim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          accumulatedRef.current += (accumulatedRef.current ? ' ' : '') + transcript.trim()
          interimRef.current = ''
        } else {
          currentInterim += transcript
          interimRef.current = currentInterim
        }
      }
      setInterim((accumulatedRef.current + (currentInterim ? ' ' + currentInterim : '')).trim())
    }

    recognition.onerror = () => {
      recognitionRef.current = null
      setListening(false)
      setInterim('')
    }

    recognition.onend = () => {
      recognitionRef.current = null
      setListening(false)
      setInterim('')
    }

    recognition.start()
  }

  function stopListening() {
    // Combine finalized + any unfinalized interim text
    const full = [accumulatedRef.current, interimRef.current]
      .filter(Boolean)
      .join(' ')
      .trim()

    // abort() terminates instantly — stop() waits for browser to finalize (causes ~20s delay)
    recognitionRef.current?.abort()
    recognitionRef.current = null

    setInterim('')
    setListening(false)

    // Send after aborting so recognition doesn't interfere
    if (full) onTranscript(full)
  }

  if (!supported) {
    return (
      <p className="text-xs text-gray-400 text-center">
        Voice not supported in this browser. Use Chrome or Edge.
      </p>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {interim && (
        <p className="text-xs text-gray-500 italic max-w-xs text-center truncate">
          &ldquo;{interim}&rdquo;
        </p>
      )}
      <button
        onMouseDown={startListening}
        onMouseUp={stopListening}
        onTouchStart={startListening}
        onTouchEnd={stopListening}
        disabled={disabled}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all select-none ${
          listening
            ? 'bg-red-500 scale-110 shadow-lg shadow-red-200 animate-pulse'
            : disabled
            ? 'bg-gray-200 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg active:scale-95'
        }`}
        title={listening ? 'Release to send' : 'Hold to talk'}
      >
        <svg
          className="w-7 h-7 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          {listening ? (
            <rect x="6" y="6" width="12" height="12" rx="1" />
          ) : (
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm-1 3a1 1 0 0 1 2 0v8a1 1 0 0 1-2 0V4zm-4 8a5 5 0 0 0 10 0h2a7 7 0 0 1-6 6.93V21h2v2H9v-2h2v-2.07A7 7 0 0 1 5 12H7z" />
          )}
        </svg>
      </button>
      <p className="text-xs text-gray-400">
        {listening ? 'Listening… release to send' : 'Hold to talk'}
      </p>
    </div>
  )
}
