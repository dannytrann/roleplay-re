import { NextRequest } from 'next/server'

export const maxDuration = 10

const VOICE_MAP = {
  female: 'en-US-Neural2-F',
  male: 'en-US-Neural2-D',
} as const

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_TTS_API_KEY
    if (!apiKey) {
      return new Response('GOOGLE_TTS_API_KEY not configured', { status: 500 })
    }

    const { text, gender } = await req.json() as { text: string; gender?: 'male' | 'female' }
    if (!text?.trim()) return new Response('Missing text', { status: 400 })

    const voice = VOICE_MAP[gender ?? 'male']

    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: 'en-US', name: voice },
          audioConfig: { audioEncoding: 'MP3' },
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('[TTS] Google API error:', err)
      return new Response('TTS failed', { status: 500 })
    }

    const { audioContent } = await res.json() as { audioContent: string }
    const audio = Buffer.from(audioContent, 'base64')

    return new Response(audio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[TTS] Error:', error)
    return new Response('TTS failed', { status: 500 })
  }
}
