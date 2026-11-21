import { audioBase64ToPlayableUrl } from './audioUtils'

const ttsUrlCache = new Map()
const inflightMap = new Map()
const TTS_MODELS = ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts', 'gemini-2.5-flash-preview-tts']

/**
 * Fetches HD neural audio via /api/tts (Vercel) or direct Gemini 3.8 Flash Lite TTS (local dev),
 * deduplicates concurrent calls, caches the Blob URL in memory, and returns the playable URL.
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
  if (inflightMap.has(cacheKey)) {
    return inflightMap.get(cacheKey)
  }

  const promise = (async () => {
    const directKey =
      localApiKey.trim() ||
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('gemini_tutor_key') || '' : '') ||
      import.meta.env.VITE_GEMINI_API_KEY ||
      ''

    let audioBase64 = ''
    let mimeType = 'audio/wav'
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
      mimeType = data.mimeType || 'audio/wav'
      sampleRate = data.sampleRate || 24000
    } else {
      let lastErr = 'Gemini TTS error'
      for (const model of TTS_MODELS) {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
            directKey
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
        const data = await res.json()
        if (res.ok) {
          const inline = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData
          if (inline?.data) {
            audioBase64 = inline.data
            mimeType = inline.mimeType || 'audio/wav'
            const rateMatch = String(mimeType).match(/rate=(\d+)/)
            if (rateMatch) sampleRate = Number(rateMatch[1])
            break
          }
        }
        lastErr = data?.error?.message || `HTTP ${res.status}`
      }
      if (!audioBase64) throw new Error(lastErr)
    }

    const url = audioBase64ToPlayableUrl(audioBase64, mimeType, sampleRate)
    ttsUrlCache.set(cacheKey, url)
    return url
  })()

  inflightMap.set(cacheKey, promise)
  try {
    return await promise
  } finally {
    inflightMap.delete(cacheKey)
  }
}

export function prefetchGeminiTts(text, voiceName = 'Kore') {
  getGeminiTtsUrl(text, voiceName).catch(() => {})
}
