import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getScenario, getPersonality, buildSystemPrompt } from '@/lib/scenarios'
import { Message, Difficulty } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
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
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
    })

    const history = messages.slice(0, -1).map(m => ({
      role: m.role as 'user' | 'model',
      parts: [{ text: m.content }],
    }))

    const chat = model.startChat({ history })
    const lastMessage = messages[messages.length - 1]
    const result = await chat.sendMessageStream(lastMessage.content)

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            controller.enqueue(encoder.encode(chunk.text()))
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    const message = error instanceof Error ? error.message : 'Failed to get response'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
