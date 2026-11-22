import { checkRateLimit } from './_rateLimit.js'

const MODEL_CHAIN = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.5-flash']

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!checkRateLimit(req, res, { bucket: 'transcribe', maxPerIp: 18, maxGlobal: 150, windowMs: 10 * 60 * 1000 })) {
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' })
  }

  try {
    const { audioBase64, audioMimeType = 'audio/webm' } = req.body || {}
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ error: 'Missing audioBase64.' })
    }

    const cleanMime = String(audioMimeType).split(';')[0] || 'audio/webm'
    let lastErr = 'Transcription failed.'

    for (const model of MODEL_CHAIN) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          apiKey
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType: cleanMime,
                      data: audioBase64,
                    },
                  },
                  {
                    text: 'Transcribe exactly what the speaker said (in English or Spanish). Return ONLY the spoken words with normal punctuation and nothing else. If silent or unintelligible, return an empty string.',
                  },
                ],
              },
            ],
            generationConfig: { temperature: 0, maxOutputTokens: 160 },
          }),
        }
      )

      const data = await response.json()
      if (response.ok) {
        const transcript = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim()
        return res.status(200).json({ transcript, model })
      }
      lastErr = data?.error?.message || `HTTP ${response.status}`
    }

    return res.status(502).json({ error: lastErr })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unexpected transcription error' })
  }
}
