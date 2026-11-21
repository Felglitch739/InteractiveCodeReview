/**
 * Converts base64 audio returned by Gemini TTS (either direct audio/wav or raw 16-bit PCM)
 * into a browser-playable Blob object URL.
 */
export function audioBase64ToPlayableUrl(base64Data, mimeType = 'audio/wav', sampleRate = 24000) {
  const lower = String(mimeType || '').toLowerCase()
  if (lower.includes('wav') || lower.includes('mp3') || lower.includes('mpeg') || lower.includes('ogg')) {
    const binaryStr = atob(base64Data)
    const bytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i)
    }
    const blob = new Blob([bytes], { type: lower.split(';')[0] || 'audio/wav' })
    return URL.createObjectURL(blob)
  }
  return pcmBase64ToWavUrl(base64Data, sampleRate)
}

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
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, pcmLen, true)

  const bytes = new Uint8Array(buffer, 44)
  for (let i = 0; i < pcmLen; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }

  const blob = new Blob([buffer], { type: 'audio/wav' })
  return URL.createObjectURL(blob)
}
