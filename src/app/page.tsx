'use client'

import { useState } from 'react'
import { scenarios } from '@/lib/scenarios'
import { Scenario } from '@/types'
import ScenarioCard from '@/components/ScenarioCard'
import PersonalitySelector from '@/components/PersonalitySelector'

const steps = [
  { step: '1', title: 'Pick a scenario', desc: 'Choose from 6 common real estate situations' },
  { step: '2', title: 'Set the challenge', desc: 'Select client personality and difficulty level' },
  { step: '3', title: 'Practice & get scored', desc: 'Speak or type — get AI feedback when done' },
]

export default function HomePage() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)

  return (
    <div>
      {/* Hero */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Real Estate Roleplay Trainer</h1>
        <p className="text-gray-500 text-sm sm:text-base max-w-xl">
          Practice real conversations with AI clients. Pick a scenario, choose a personality, and sharpen your skills — on your schedule.
        </p>
      </div>

      {/* How it works — single row on desktop, horizontal scroll on mobile */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3">
        {steps.map(item => (
          <div
            key={item.step}
            className="flex-shrink-0 w-52 sm:w-auto bg-white rounded-xl border border-gray-200 p-3 flex gap-3 items-start"
          >
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
              {item.step}
            </span>
            <div>
              <p className="font-semibold text-sm text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Scenario grid */}
      <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Choose a Scenario</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {scenarios.map(scenario => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            onClick={setSelectedScenario}
          />
        ))}
      </div>

      <PersonalitySelector
        scenario={selectedScenario}
        onClose={() => setSelectedScenario(null)}
      />
    </div>
  )
}
