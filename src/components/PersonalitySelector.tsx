'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Scenario, Difficulty } from '@/types'
import { personalities, difficultyDescriptions, getPersonality, buildSystemPrompt } from '@/lib/scenarios'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PersonalitySelectorProps {
  scenario: Scenario | null
  onClose: () => void
}

const difficultyStyles: Record<Difficulty, string> = {
  easy: 'border-green-400 bg-green-50 text-green-800',
  medium: 'border-yellow-400 bg-yellow-50 text-yellow-800',
  hard: 'border-red-400 bg-red-50 text-red-800',
}

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export default function PersonalitySelector({ scenario, onClose }: PersonalitySelectorProps) {
  const router = useRouter()
  const [selectedPersonality, setSelectedPersonality] = useState<string>('skeptical')
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium')
  const [copied, setCopied] = useState(false)
  const [showOpenLink, setShowOpenLink] = useState(false)

  function handleStart() {
    if (!scenario) return
    router.push(
      `/session/${scenario.id}?personality=${selectedPersonality}&difficulty=${selectedDifficulty}`
    )
  }

  function handleCopyForGemini() {
    if (!scenario) return
    const personalityObj = getPersonality(selectedPersonality)
    if (!personalityObj) return

    const systemPrompt = buildSystemPrompt(scenario, personalityObj, selectedDifficulty)

    const fullPrompt = `You are about to do a real estate sales roleplay with me. I am the real estate agent. You will play the role of the client.

${systemPrompt}

---
When you're ready, start the conversation by saying a brief opening line as ${scenario.clientName}. I'll respond as the agent.`

    navigator.clipboard.writeText(fullPrompt).then(() => {
      setCopied(true)
      setShowOpenLink(true)
      setTimeout(() => setCopied(false), 3000)
    })
  }

  return (
    <Dialog open={!!scenario} onOpenChange={open => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug pr-6">{scenario?.title}</DialogTitle>
          <DialogDescription>
            Customize your practice session before starting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Personality */}
          <div>
            <p className="text-sm font-semibold mb-2">Client Personality</p>
            <div className="grid grid-cols-1 gap-2">
              {personalities.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPersonality(p.id)}
                  className={`text-left px-3 py-2.5 rounded-lg border-2 transition-all ${
                    selectedPersonality === p.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="text-sm font-medium block">{p.label}</span>
                  <span className="text-xs text-muted-foreground">{p.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <p className="text-sm font-semibold mb-2">Difficulty</p>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDifficulty(d)}
                  className={`px-3 py-2 rounded-lg border-2 font-medium text-sm transition-all ${
                    selectedDifficulty === d
                      ? difficultyStyles[d]
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {difficultyLabels[d]}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {difficultyDescriptions[selectedDifficulty]}
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pb-1">
            <Button onClick={handleStart} className="w-full" size="lg">
              Start Session
            </Button>

            <Button
              onClick={handleCopyForGemini}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {copied ? (
                <span className="flex items-center gap-2 text-green-600">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Prompt Copied!
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Prompt for Gemini
                </span>
              )}
            </Button>

            {/* Real <a> tag so iOS Universal Links opens the Gemini app */}
            {showOpenLink ? (
              <a
                href="https://gemini.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open Gemini → paste and go
              </a>
            ) : (
              <p className="text-xs text-center text-gray-400">
                Copy the prompt, then open Gemini and paste to start
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
