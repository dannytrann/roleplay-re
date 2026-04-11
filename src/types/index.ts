export type Scenario = {
  id: string
  title: string
  clientName: string
  clientRole: string
  description: string
  systemPrompt: string
  scoringCriteria: string[]
  tags: string[]
}

export type Personality = {
  id: string
  label: string
  description: string
  promptModifier: string
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export type Message = {
  role: 'user' | 'model'
  content: string
  timestamp: string
}

export type Score = {
  rapport: number
  objectionHandling: number
  activeListening: number
  closeAttempt: number
  overall: number
  wentWell: string
  improve: string
}

export type Session = {
  id: string
  scenarioId: string
  scenarioTitle: string
  clientName: string
  personality: string
  difficulty: Difficulty
  date: string
  durationSeconds: number
  messages: Message[]
  score: Score | null
}
