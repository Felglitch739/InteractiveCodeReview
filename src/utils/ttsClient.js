import { pcmBase64ToWavUrl } from './audioUtils'

const ttsUrlCache = new Map()

/**
 * Fetches HD studio neural audio via /api/tts (Vercel) or direct Gemini TTS (local dev),
 * caches the resulting 24kHz WAV blob URL in memory, and returns the URL.
 */
export async function getGeminiTtsUrl(text, voiceName = 'Kore', localApiKey = '') {
  const cleanText = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[`*_#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 900)

  const cacheKey = `${voiceName}::${cleanText}`
  if (ttsUrlCache.has(cacheKey)) {
    return ttsUrlCache.get(cacheKey)
  }

  const directKey =
    localApiKey.trim() ||
    (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('gemini_tutor_key') || '' : '') ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    ''

  let audioBase64 = ''
  let sampleRate = 24000

  if (!directKey) {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText, voice: voiceName }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'TTS request failed')
    audioBase64 = data.audioBase64
    sampleRate = data.sampleRate || 24000
  } else {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${encodeURIComponent(
        directKey
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
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error?.message || 'Gemini TTS error')
    const inline = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData
    if (!inline?.data) throw new Error('No audio returned from Gemini TTS.')
    audioBase64 = inline.data
    const rateMatch = String(inline.mimeType || '').match(/rate=(\d+)/)
    if (rateMatch) sampleRate = Number(rateMatch[1])
  }

  const wavUrl = pcmBase64ToWavUrl(audioBase64, sampleRate)
  ttsUrlCache.set(cacheKey, wavUrl)
  return wavUrl
}
