import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getScenario, getPersonality, buildSystemPrompt } from '@/lib/scenarios'
import { Message, Difficulty } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set')
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const { messages, scenarioId, personality, difficulty } = await req.json() as {
      messages: Message[]
      scenarioId: string
      personality: string
      difficulty: Difficulty
    }

    const scenario = getScenario(scenarioId)
    const personalityObj = getPersonality(personality)

    if (!scenario || !personalityObj) {
      return NextResponse.json({ error: 'Invalid scenario or personality' }, { status: 400 })
    }

    const systemPrompt = buildSystemPrompt(scenario, personalityObj, difficulty)

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
    })

    // Convert our messages to Gemini history format (all except the last user message)
    const history = messages.slice(0, -1).map(m => ({
      role: m.role as 'user' | 'model',
      parts: [{ text: m.content }],
    }))

    const chat = model.startChat({ history })

    const lastMessage = messages[messages.length - 1]
    const result = await chat.sendMessage(lastMessage.content)
    const reply = result.response.text()

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat API error:', error)
    const message = error instanceof Error ? error.message : 'Failed to get response'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
