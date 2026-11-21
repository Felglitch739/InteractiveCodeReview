const ALLOWED_VOICES = new Set(['Kore', 'Puck', 'Zephyr', 'Fenrir', 'Aoede', 'Charon'])

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Read the following friendly tutoring explanation naturally and clearly:\n\n${cleanText}`,
                },
              ],
            },
          ],
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
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'TTS API error' })
    }

    const inline = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData
    if (!inline?.data) {
      return res.status(502).json({ error: 'No audio returned from Gemini TTS.' })
    }

    const rateMatch = String(inline.mimeType || '').match(/rate=(\d+)/)
    const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000

    return res.status(200).json({
      audioBase64: inline.data,
      sampleRate,
      voice: voiceName,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unexpected TTS server error' })
  }
}
