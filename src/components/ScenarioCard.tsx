'use client'

import { Scenario } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ScenarioCardProps {
  scenario: Scenario
  onClick: (scenario: Scenario) => void
}

const tagColors: Record<string, string> = {
  'Cold Call': 'bg-blue-100 text-blue-800',
  'Seller': 'bg-green-100 text-green-800',
  'Buyer': 'bg-purple-100 text-purple-800',
  'Objections': 'bg-orange-100 text-orange-800',
  'Listing': 'bg-teal-100 text-teal-800',
  'Pricing': 'bg-red-100 text-red-800',
  'FSBO': 'bg-yellow-100 text-yellow-800',
  'Commission': 'bg-pink-100 text-pink-800',
  'Expired': 'bg-gray-100 text-gray-800',
  'Trust': 'bg-indigo-100 text-indigo-800',
  'Investor': 'bg-emerald-100 text-emerald-800',
  'Data-Driven': 'bg-cyan-100 text-cyan-800',
  'First-Time': 'bg-violet-100 text-violet-800',
}

export default function ScenarioCard({ scenario, onClick }: ScenarioCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-2 hover:border-blue-400 group"
      onClick={() => onClick(scenario)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-tight group-hover:text-blue-600 transition-colors">
            {scenario.title}
          </CardTitle>
        </div>
        <div className="text-sm text-muted-foreground font-medium">
          Client: <span className="text-foreground">{scenario.clientName}</span> &middot; {scenario.clientRole}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm mb-3 leading-relaxed">
          {scenario.description}
        </CardDescription>
        <div className="flex flex-wrap gap-1.5">
          {scenario.tags.map(tag => (
            <span
              key={tag}
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tagColors[tag] ?? 'bg-gray-100 text-gray-700'}`}
            >
              {tag}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
