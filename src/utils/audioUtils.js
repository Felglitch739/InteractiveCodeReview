/**
 * Wraps base64-encoded 16-bit little-endian mono PCM (from Gemini TTS)
 * in a standard 44-byte RIFF/WAV header and returns an object URL playable in any <audio>.
 */
export function pcmBase64ToWavUrl(base64Pcm, sampleRate = 24000) {
  const binaryStr = atob(base64Pcm)
  const pcmLen = binaryStr.length
  const buffer = new ArrayBuffer(44 + pcmLen)
  const view = new DataView(buffer)

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + pcmLen, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true) // PCM chunk size
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, 1, true) // Mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true) // Byte rate (sampleRate * 1ch * 2bytes)
  view.setUint16(32, 2, true) // Block align
  view.setUint16(34, 16, true) // Bits per sample
  writeStr(36, 'data')
  view.setUint32(40, pcmLen, true)

  const bytes = new Uint8Array(buffer, 44)
  for (let i = 0; i < pcmLen; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }

  const blob = new Blob([buffer], { type: 'audio/wav' })
  return URL.createObjectURL(blob)
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = String(reader.result || '')
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function pickSupportedAudioMime() {
  if (typeof MediaRecorder === 'undefined') return ''
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ]
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) || ''
}
