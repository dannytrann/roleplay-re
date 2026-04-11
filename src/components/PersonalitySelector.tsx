'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Scenario, Personality, Difficulty } from '@/types'
import { personalities, difficultyDescriptions } from '@/lib/scenarios'
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

  function handleStart() {
    if (!scenario) return
    router.push(
      `/session/${scenario.id}?personality=${selectedPersonality}&difficulty=${selectedDifficulty}`
    )
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

          <Button onClick={handleStart} className="w-full" size="lg">
            Start Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
