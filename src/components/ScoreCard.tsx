'use client'

import { Score } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ScoreCardProps {
  score: Score
  scenarioTitle: string
  onClose: () => void
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg
          key={i}
          className={`w-5 h-5 ${i <= value ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

const criteriaLabels: Record<string, string> = {
  rapport: 'Rapport Building',
  objectionHandling: 'Objection Handling',
  activeListening: 'Active Listening',
  closeAttempt: 'Close Attempt',
}

export default function ScoreCard({ score, scenarioTitle, onClose }: ScoreCardProps) {
  const criteria = ['rapport', 'objectionHandling', 'activeListening', 'closeAttempt'] as const

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Session Complete</DialogTitle>
          <p className="text-sm text-muted-foreground">{scenarioTitle}</p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Overall score */}
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-sm text-blue-600 font-medium mb-1">Overall Score</p>
            <p className="text-5xl font-bold text-blue-700">{score.overall}<span className="text-2xl text-blue-400">/5</span></p>
            <StarRating value={score.overall} />
          </div>

          {/* Breakdown */}
          <div className="space-y-3">
            {criteria.map(key => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{criteriaLabels[key]}</span>
                <div className="flex items-center gap-2">
                  <StarRating value={score[key]} />
                  <span className="text-sm font-semibold text-gray-600 w-5 text-right">{score[key]}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-700 mb-1">What went well</p>
              <p className="text-sm text-green-800">{score.wentWell}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-orange-700 mb-1">Work on this</p>
              <p className="text-sm text-orange-800">{score.improve}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Link href="/history" className="flex-1">
              <Button variant="outline" className="w-full">Review Transcript</Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button className="w-full">Practice Again</Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
