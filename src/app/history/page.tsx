'use client'

import { useState, useEffect } from 'react'
import { getSessions, deleteSession } from '@/lib/history'
import { Session, Score, Difficulty } from '@/types'
import Link from 'next/link'

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className={`w-4 h-4 ${i <= value ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

const difficultyBadge: Record<Difficulty, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
}

const criteriaLabels: Record<string, string> = {
  rapport: 'Rapport',
  objectionHandling: 'Objections',
  activeListening: 'Listening',
  closeAttempt: 'Close',
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m}m ${s}s`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    setSessions(getSessions())
  }, [])

  function handleDelete(id: string) {
    deleteSession(id)
    setSessions(getSessions())
    if (expanded === id) setExpanded(null)
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">📋</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">No sessions yet</h2>
        <p className="text-gray-500 mb-6">Complete a roleplay session to see your history here.</p>
        <Link href="/" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          Start Practicing
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Practice History</h1>
        <p className="text-gray-500 text-sm">{sessions.length} session{sessions.length !== 1 ? 's' : ''} saved</p>
      </div>

      <div className="space-y-3">
        {sessions.map(session => (
          <div key={session.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Session header */}
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 text-sm">{session.scenarioTitle}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyBadge[session.difficulty]}`}>
                    {session.difficulty}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                  <span>{formatDate(session.date)}</span>
                  <span>{session.messages.length} messages</span>
                  <span>{formatDuration(session.durationSeconds)}</span>
                  <span>Personality: {session.personality}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {session.score && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-gray-700">{session.score.overall}/5</span>
                    <StarRating value={session.score.overall} />
                  </div>
                )}
                {!session.score && (
                  <span className="text-xs text-gray-400 italic">No score</span>
                )}
                <button
                  onClick={() => setExpanded(expanded === session.id ? null : session.id)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                  title={expanded === session.id ? 'Collapse' : 'Expand'}
                >
                  <svg className={`w-4 h-4 transition-transform ${expanded === session.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(session.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors text-gray-400"
                  title="Delete session"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Expanded content */}
            {expanded === session.id && (
              <div className="border-t border-gray-100">
                <div className="grid md:grid-cols-2 gap-0 md:divide-x divide-gray-100">
                  {/* Transcript */}
                  <div className="p-4 max-h-80 overflow-y-auto">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Transcript</p>
                    <div className="space-y-2">
                      {session.messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            <span className="font-medium opacity-70 block mb-0.5">
                              {msg.role === 'user' ? 'You' : session.clientName}
                            </span>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Score breakdown */}
                  <div className="p-4">
                    {session.score ? (
                      <>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Score Breakdown</p>
                        <div className="space-y-2 mb-4">
                          {(['rapport', 'objectionHandling', 'activeListening', 'closeAttempt'] as (keyof Score)[]).filter(k => typeof session.score![k] === 'number').map(key => (
                            <div key={String(key)} className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">{criteriaLabels[String(key)]}</span>
                              <div className="flex items-center gap-1.5">
                                <StarRating value={session.score![key] as number} />
                                <span className="text-xs font-semibold text-gray-600 w-4">{session.score![key]}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <div className="bg-green-50 rounded-lg p-2.5">
                            <p className="text-xs font-semibold text-green-700 mb-1">Went well</p>
                            <p className="text-xs text-green-800">{session.score.wentWell}</p>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-2.5">
                            <p className="text-xs font-semibold text-orange-700 mb-1">Work on</p>
                            <p className="text-xs text-orange-800">{session.score.improve}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        No score available for this session
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
