import { NextRequest } from 'next/server'

export const maxDuration = 60

const VOICE_MAP = { female: 'af_heart', male: 'am_michael' } as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ttsInstance: any = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTTS(): Promise<any> {
  if (ttsInstance) {
    console.log('[TTS] Using cached model instance')
    return ttsInstance
  }
  console.log('[TTS] Loading Kokoro model (device: cpu)…')
  const { KokoroTTS } = await import('kokoro-js')
  ttsInstance = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
    dtype: 'q8',
    device: 'cpu',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    progress_callback: (p: any) => {
      if (p.status === 'downloading') {
        const pct = p.progress ? Math.round(p.progress) : '?'
        console.log(`[TTS] Downloading ${p.file} — ${pct}%`)
      } else {
        console.log(`[TTS] ${p.status}`)
      }
    },
  })
  console.log('[TTS] Model ready ✓')
  return ttsInstance
}

export async function POST(req: NextRequest) {
  try {
    const { text, gender } = await req.json() as { text: string; gender?: 'male' | 'female' }

    if (!text?.trim()) {
      return new Response('Missing text', { status: 400 })
    }

    console.log(`[TTS] Generating audio for: "${text.slice(0, 60)}…"`)
    const tts = await getTTS()
    const voice = VOICE_MAP[gender ?? 'male']
    const audio = await tts.generate(text, { voice })
    const wav = audio.toWav()
    console.log('[TTS] Audio generated, sending response')

    return new Response(wav, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[TTS] Error:', error)
    return new Response('TTS failed', { status: 500 })
  }
}
