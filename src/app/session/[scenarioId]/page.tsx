'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { getScenario } from '@/lib/scenarios'
import { saveSession, generateSessionId } from '@/lib/history'
import { speak, stopSpeaking, unlockAudio } from '@/lib/speech'
import { Message, Score, Difficulty, Session } from '@/types'
import VoiceButton from '@/components/VoiceButton'
import ScoreCard from '@/components/ScoreCard'
import Link from 'next/link'

export default function SessionPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const scenarioId = params.scenarioId as string
  const personality = searchParams.get('personality') ?? 'skeptical'
  const difficulty = (searchParams.get('difficulty') ?? 'medium') as Difficulty

  const scenario = getScenario(scenarioId)

  const [messages, setMessages] = useState<Message[]>([])
  const [textInput, setTextInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState<Score | null>(null)
  const [scoring, setScoring] = useState(false)
  const [sessionId] = useState(generateSessionId)
  const [startTime] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Redirect if scenario not found
  useEffect(() => {
    if (!scenario) router.replace('/')
  }, [scenario, router])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return
    unlockAudio()

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setLoading(true)
    stopSpeaking()

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          scenarioId,
          personality,
          difficulty,
        }),
      })

      const data = await res.json()
      const reply = data.reply as string

      const modelMessage: Message = {
        role: 'model',
        content: reply,
        timestamp: new Date().toISOString(),
      }

      const finalMessages = [...updatedMessages, modelMessage]
      setMessages(finalMessages)

      if (voiceEnabled) {
        speak(reply, scenario?.voiceGender ?? 'male')
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'model', content: 'Sorry, something went wrong. Please try again.', timestamp: new Date().toISOString() },
      ])
    } finally {
      setLoading(false)
    }
  }, [messages, loading, scenarioId, personality, difficulty, voiceEnabled])

  async function handleEndSession() {
    if (messages.length < 2) {
      router.push('/')
      return
    }

    stopSpeaking()
    setScoring(true)

    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, scenarioId }),
      })
      const data = await res.json()
      const sessionScore: Score = data.score

      setScore(sessionScore)

      const session: Session = {
        id: sessionId,
        scenarioId,
        scenarioTitle: scenario!.title,
        clientName: scenario!.clientName,
        personality,
        difficulty,
        date: new Date().toISOString(),
        durationSeconds: elapsed,
        messages,
        score: sessionScore,
      }
      saveSession(session)
    } catch {
      // Save without score
      const session: Session = {
        id: sessionId,
        scenarioId,
        scenarioTitle: scenario!.title,
        clientName: scenario!.clientName,
        personality,
        difficulty,
        date: new Date().toISOString(),
        durationSeconds: elapsed,
        messages,
        score: null,
      }
      saveSession(session)
    } finally {
      setScoring(false)
    }
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!textInput.trim()) return
    unlockAudio()
    sendMessage(textInput)
    setTextInput('')
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  if (!scenario) return null

  const difficultyBadge: Record<Difficulty, string> = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -mt-8 -mx-4">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <p className="font-semibold text-sm text-gray-900">{scenario.title}</p>
            <p className="text-xs text-gray-500">
              {scenario.clientName} &middot;{' '}
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${difficultyBadge[difficulty]}`}>
                {difficulty}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-gray-500">{formatTime(elapsed)}</span>
          <button
            onClick={handleEndSession}
            disabled={scoring || messages.length === 0}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {scoring ? 'Scoring…' : 'End Session'}
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
        {/* Intro card */}
        {messages.length === 0 && (
          <div className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 p-5 text-center mt-8">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
              👤
            </div>
            <p className="font-semibold text-gray-900">{scenario.clientName}</p>
            <p className="text-sm text-gray-500 mb-3">{scenario.clientRole}</p>
            <p className="text-sm text-gray-600 leading-relaxed">{scenario.description}</p>
            <p className="text-xs text-gray-400 mt-4">Tap the mic button or type to start the conversation.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1">
                👤
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
              }`}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm ml-2 flex-shrink-0 mt-1">
                🎙
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm mr-2 flex-shrink-0">
              👤
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Bottom input bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-end gap-3 max-w-3xl mx-auto">
          {/* Voice toggle */}
          <button
            onClick={() => setVoiceEnabled(v => !v)}
            className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors ${
              voiceEnabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
            }`}
            title={voiceEnabled ? 'Voice on' : 'Voice off'}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              {voiceEnabled
                ? <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                : <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              }
            </svg>
            <span className="text-[10px] font-medium leading-none">{voiceEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <VoiceButton onTranscript={sendMessage} disabled={loading} />

          {/* Text input */}
          <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Or type your response…"
              disabled={loading}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || loading}
              className="px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Score card modal */}
      {score && (
        <ScoreCard
          score={score}
          scenarioTitle={scenario.title}
          onClose={() => router.push('/')}
        />
      )}
    </div>
  )
}
