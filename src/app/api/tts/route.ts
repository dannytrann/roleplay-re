import OpenAI from 'openai'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 })
  }

  const { text, voice } = await req.json()
  if (!text) {
    return Response.json({ error: 'No text provided' }, { status: 400 })
  }

  const openai = new OpenAI({ apiKey })

  try {
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice ?? 'onyx',
      input: text,
    })

    const buffer = Buffer.from(await mp3.arrayBuffer())
    return new Response(buffer, {
      headers: { 'Content-Type': 'audio/mpeg' },
    })
  } catch (err: any) {
    const msg = err?.message ?? String(err)
    console.error('TTS error:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
