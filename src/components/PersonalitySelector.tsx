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
  const canShare = typeof navigator !== 'undefined' && !!navigator.share

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

    // Mobile: use native share sheet so user can tap directly into Gemini app
    // Desktop: fall back to clipboard copy
    if (navigator.share) {
      navigator.share({
        title: `RolePlay RE — ${scenario.title}`,
        text: fullPrompt,
      }).catch(() => {
        // User dismissed share sheet — no action needed
      })
    } else {
      navigator.clipboard.writeText(fullPrompt).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      })
    }
  }

  return (
    <Dialog open={!!scenario} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">{scenario?.title}</DialogTitle>
          <DialogDescription>
            Customize your practice session before starting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Personality */}
          <div>
            <p className="text-sm font-semibold mb-2">Client Personality</p>
            <div className="grid grid-cols-1 gap-2">
              {personalities.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPersonality(p.id)}
                  className={`text-left px-3 py-2.5 rounded-lg border-2 transition-all text-sm ${
                    selectedPersonality === p.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="font-medium">{p.label}</span>
                  <span className="text-muted-foreground ml-2">— {p.description}</span>
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
          <div className="space-y-2">
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied! Paste into Gemini
                </span>
              ) : canShare ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share to Gemini
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Prompt for Gemini
                </span>
              )}
            </Button>

            <p className="text-xs text-center text-gray-400">
              {canShare
                ? 'Tap Share to Gemini → open Gemini Live and paste to start'
                : 'Paste into gemini.google.com to practice using your own Gemini account'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
