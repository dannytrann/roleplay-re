'use client'

import { useState, useRef, useEffect } from 'react'
import { isSpeechRecognitionSupported } from '@/lib/speech'

interface VoiceButtonProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export default function VoiceButton({ onTranscript, disabled }: VoiceButtonProps) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const [liveText, setLiveText] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    setSupported(isSpeechRecognitionSupported())
  }, [])

  function startRecording() {
    const w = window as any
    const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SpeechRec) {
      setErrorMsg('Speech API not found')
      return
    }

    try {
      const recognition = new SpeechRec()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognitionRef.current = recognition
      setLiveText('')
      setErrorMsg('')

      let finalTranscript = ''

      recognition.onresult = (e: any) => {
        let interim = ''
        finalTranscript = ''
        for (let i = 0; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            finalTranscript += e.results[i][0].transcript
          } else {
            interim += e.results[i][0].transcript
          }
        }
        setLiveText((finalTranscript || interim).trim())
      }

      recognition.onend = () => {
        setListening(false)
        setLiveText('')
        recognitionRef.current = null
        const text = finalTranscript.trim()
        if (text) onTranscript(text)
      }

      recognition.onerror = (e: any) => {
        setListening(false)
        setLiveText('')
        recognitionRef.current = null
        const code = e?.error ?? 'unknown'
        if (code === 'not-allowed') {
          setErrorMsg('Mic permission denied — check browser settings')
        } else if (code === 'service-not-allowed') {
          setErrorMsg('Enable Dictation: Settings → General → Keyboard → Enable Dictation')
        } else if (code === 'no-speech') {
          setErrorMsg('No speech detected — try again')
        } else if (code === 'network') {
          setErrorMsg('Network error — check connection')
        } else {
          setErrorMsg(`Error: ${code}`)
        }
      }

      recognition.start()
      setListening(true)
    } catch (err: any) {
      setListening(false)
      setErrorMsg(err?.message ?? 'Failed to start')
    }
  }

  function stopRecording() {
    recognitionRef.current?.stop()
  }

  function handleTap() {
    if (disabled) return
    setErrorMsg('')
    if (listening) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  if (!supported) {
    return (
      <p className="text-xs text-gray-400 text-center">
        Voice not supported in this browser.
      </p>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
      {errorMsg ? (
        <p className="text-xs text-red-500 text-center max-w-[180px]">{errorMsg}</p>
      ) : liveText ? (
        <p className="text-xs text-gray-500 italic max-w-[200px] text-center line-clamp-2">
          &ldquo;{liveText}&rdquo;
        </p>
      ) : (
        <p className="text-xs text-gray-400">
          {listening ? 'Tap to send' : 'Tap to talk'}
        </p>
      )}
      <button
        onClick={handleTap}
        disabled={disabled}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all select-none touch-manipulation ${
          listening
            ? 'bg-red-500 scale-110 shadow-lg shadow-red-200 animate-pulse'
            : disabled
            ? 'bg-gray-200 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 shadow-md active:scale-95'
        }`}
      >
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          {listening ? (
            <rect x="6" y="6" width="12" height="12" rx="2" />
          ) : (
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm-1 3a1 1 0 0 1 2 0v8a1 1 0 0 1-2 0V4zm-4 8a5 5 0 0 0 10 0h2a7 7 0 0 1-6 6.93V21h2v2H9v-2h2v-2.07A7 7 0 0 1 5 12H7z" />
          )}
        </svg>
      </button>
    </div>
  )
}
