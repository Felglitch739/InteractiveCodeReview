import { checkRateLimit } from './_rateLimit.js'

const ALLOWED_VOICES = new Set(['Kore', 'Puck', 'Zephyr', 'Fenrir', 'Aoede', 'Charon'])
const TTS_MODELS = ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts', 'gemini-2.5-flash-preview-tts']

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!checkRateLimit(req, res, { bucket: 'tts', maxPerIp: 24, maxGlobal: 180, windowMs: 10 * 60 * 1000 })) {
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' })
  }

  try {
    const { text, voice = 'Kore' } = req.body || {}
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing text.' })
    }

    const voiceName = ALLOWED_VOICES.has(voice) ? voice : 'Kore'
    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/[`*_#]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 900)

    let lastErr = 'TTS API error'

    for (const model of TTS_MODELS) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          apiKey
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: cleanText }] }],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName },
                },
              },
            },
          }),
        }
      )

      const data = await response.json()
      if (response.ok) {
        const inline = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData
        if (inline?.data) {
          const mimeType = inline.mimeType || 'audio/wav'
          const rateMatch = String(mimeType).match(/rate=(\d+)/)
          const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000
          return res.status(200).json({
            audioBase64: inline.data,
            mimeType,
            sampleRate,
            voice: voiceName,
            model,
          })
        }
      }
      lastErr = data?.error?.message || `HTTP ${response.status}`
    }

    return res.status(502).json({ error: lastErr })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unexpected TTS server error' })
  }
}
