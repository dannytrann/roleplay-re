import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getScenario } from '@/lib/scenarios'
import { Message, Score } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set')
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)

    const { messages, scenarioId } = await req.json() as {
      messages: Message[]
      scenarioId: string
    }

    const scenario = getScenario(scenarioId)
    if (!scenario) {
      return NextResponse.json({ error: 'Invalid scenario' }, { status: 400 })
    }

    const transcript = messages
      .map(m => `${m.role === 'user' ? 'AGENT' : scenario.clientName.toUpperCase()}: ${m.content}`)
      .join('\n\n')

    const scoringPrompt = `You are an expert real estate sales coach. Evaluate this roleplay conversation transcript and score the agent.

SCENARIO: ${scenario.title}
CLIENT: ${scenario.clientName} (${scenario.clientRole})

TRANSCRIPT:
${transcript}

Score the agent on each criterion from 1 to 5:
- 1: Poor — major mistakes or completely missed
- 2: Below average — some effort but significant gaps
- 3: Average — adequate but room for clear improvement
- 4: Good — solid performance with minor gaps
- 5: Excellent — professional-level execution

Respond with ONLY valid JSON in this exact format, no other text:
{
  "rapport": <1-5>,
  "objectionHandling": <1-5>,
  "activeListening": <1-5>,
  "closeAttempt": <1-5>,
  "overall": <1-5>,
  "wentWell": "<one specific strength with a direct quote from the transcript>",
  "improve": "<one specific improvement area with a concrete actionable suggestion>"
}`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(scoringPrompt)
    const text = result.response.text().trim()

    // Strip markdown code fences if present
    const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
    const score: Score = JSON.parse(cleaned)

    return NextResponse.json({ score })
  } catch (error) {
    console.error('Score API error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate score'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
