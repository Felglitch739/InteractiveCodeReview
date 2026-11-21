function bytesToBase64(bytes) {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

function base64ToInt16(base64) {
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Int16Array(bytes.buffer)
}

/**
 * Gapless real-time 24kHz PCM audio player with instant barge-in interruption.
 */
export class PcmStreamPlayer {
  constructor(onPlayingChange) {
    this.ctx = null
    this.nextTime = 0
    this.activeSources = new Set()
    this.onPlayingChange = onPlayingChange
    this.muted = false
  }

  ensureContext() {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      this.ctx = new AudioCtx({ sampleRate: 24000 })
      this.nextTime = 0
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  setMuted(muted) {
    this.muted = muted
    if (muted) this.interrupt()
  }

  enqueueBase64(base64Pcm, sampleRate = 24000) {
    if (this.muted || !base64Pcm) return
    const ctx = this.ensureContext()
    const int16 = base64ToInt16(base64Pcm)
    if (int16.length === 0) return

    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768
    }

    const buffer = ctx.createBuffer(1, float32.length, sampleRate)
    buffer.copyToChannel(float32, 0)

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)

    const startAt = Math.max(ctx.currentTime + 0.015, this.nextTime)
    this.nextTime = startAt + buffer.duration

    this.activeSources.add(source)
    if (this.activeSources.size === 1) {
      this.onPlayingChange?.(true)
    }

    source.onended = () => {
      this.activeSources.delete(source)
      if (this.activeSources.size === 0) {
        this.onPlayingChange?.(false)
      }
    }

    source.start(startAt)
  }

  interrupt() {
    this.activeSources.forEach((src) => {
      try {
        src.stop()
      } catch {
        // already stopped
      }
    })
    this.activeSources.clear()
    this.nextTime = 0
    this.onPlayingChange?.(false)
  }

  close() {
    this.interrupt()
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {})
    }
    this.ctx = null
  }
}

/**
 * Captures live microphone audio, downsamples to 16kHz Int16 PCM,
 * uses an adaptive noise gate so laptop fan/room hum doesn't block Gemini's VAD,
 * auto-signals end-of-speech ~550ms after you pause (no manual muting needed!),
 * and drives a real-time 7-bar audio meter.
 */
export class MicPcmStreamer {
  constructor({ onChunk, onLevels, onSpeechEnd, onUserSpeakingChange }) {
    this.onChunk = onChunk
    this.onLevels = onLevels
    this.onSpeechEnd = onSpeechEnd
    this.onUserSpeakingChange = onUserSpeakingChange
    this.stream = null
    this.ctx = null
    this.processor = null
    this.source = null
    this.muted = false
    this.running = false
    this.noiseFloor = 0.008
    this.isSpeaking = false
    this.lastSpeechAt = 0
  }

  async start() {
    if (this.running) return
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    })

    const AudioCtx = window.AudioContext || window.webkitAudioContext
    this.ctx = new AudioCtx()
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }

    const inputRate = this.ctx.sampleRate
    const targetRate = 16000
    const ratio = inputRate / targetRate

    this.source = this.ctx.createMediaStreamSource(this.stream)
    this.processor = this.ctx.createScriptProcessor(2048, 1, 1)

    const silentGain = this.ctx.createGain()
    silentGain.gain.value = 0

    this.processor.onaudioprocess = (ev) => {
      if (!this.running) return
      const input = ev.inputBuffer.getChannelData(0)

      if (this.muted) {
        if (this.isSpeaking) {
          this.isSpeaking = false
          this.onUserSpeakingChange?.(false)
          this.onSpeechEnd?.()
        }
        this.onLevels?.([14, 14, 14, 14, 14, 14, 14])
        // Keep streaming digital silence while muted so any in-progress turn closes cleanly
        const outLen = Math.floor(input.length / ratio)
        const silencePcm = new Int16Array(outLen)
        this.onChunk?.(bytesToBase64(new Uint8Array(silencePcm.buffer)))
        return
      }

      // Compute RMS energy and 7 visual bars
      let sqSum = 0
      for (let i = 0; i < input.length; i++) {
        sqSum += input[i] * input[i]
      }
      const rms = Math.sqrt(sqSum / input.length)

      const step = Math.floor(input.length / 7)
      const bars = []
      for (let b = 0; b < 7; b++) {
        let sum = 0
        const start = b * step
        for (let i = start; i < start + step; i++) {
          sum += Math.abs(input[i])
        }
        const avg = sum / step
        bars.push(Math.max(16, Math.min(100, Math.round(avg * 420))))
      }
      this.onLevels?.(bars)

      // Adaptive noise floor & continuous silence-gated streaming:
      // Gemini 3.8 Live's VAD needs continuous PCM frames (digital zeros during silence)
      // to detect end-of-speech cleanly without laptop fan noise stalling it.
      const now = performance.now()
      const threshold = Math.max(0.012, this.noiseFloor * 2.1)

      if (rms > threshold) {
        this.lastSpeechAt = now
        if (!this.isSpeaking) {
          this.isSpeaking = true
          this.onUserSpeakingChange?.(true)
        }
      } else if (!this.isSpeaking) {
        // Slowly calibrate ambient room/laptop fan level when idle
        this.noiseFloor = Math.max(0.003, Math.min(0.028, this.noiseFloor * 0.96 + rms * 0.04))
      }

      // 280ms grace tail after last voiced frame so natural pauses inside words stay smooth
      if (this.isSpeaking && now - this.lastSpeechAt > 280) {
        this.isSpeaking = false
        this.onUserSpeakingChange?.(false)
        this.onSpeechEnd?.()
      }

      // Always send 16kHz Int16 PCM: real voice while speaking, pure digital zeros when silent
      const outLen = Math.floor(input.length / ratio)
      const pcm = new Int16Array(outLen)
      if (this.isSpeaking) {
        for (let i = 0; i < outLen; i++) {
          const srcIdx = i * ratio
          const idx0 = Math.floor(srcIdx)
          const idx1 = Math.min(idx0 + 1, input.length - 1)
          const frac = srcIdx - idx0
          const sample = input[idx0] * (1 - frac) + input[idx1] * frac
          const clamped = Math.max(-1, Math.min(1, sample))
          pcm[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff
        }
      }

      const b64 = bytesToBase64(new Uint8Array(pcm.buffer))
      this.onChunk?.(b64)
    }

    this.source.connect(this.processor)
    this.processor.connect(silentGain)
    silentGain.connect(this.ctx.destination)
    this.running = true
  }

  setMuted(muted) {
    this.muted = muted
    if (muted && this.isSpeaking) {
      this.isSpeaking = false
      this.onUserSpeakingChange?.(false)
      this.onSpeechEnd?.()
    }
  }

  stop() {
    this.running = false
    this.isSpeaking = false
    this.onUserSpeakingChange?.(false)
    if (this.processor) {
      this.processor.disconnect()
      this.processor.onaudioprocess = null
      this.processor = null
    }
    if (this.source) {
      this.source.disconnect()
      this.source = null
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {})
    }
    this.ctx = null
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop())
      this.stream = null
    }
    this.onLevels?.([16, 16, 16, 16, 16, 16, 16])
  }
}

/**
 * Direct WebSocket client for Gemini 3.8 Live (models/gemini-3.8-live).
 * Uses an ephemeral single-use token from /api/live-token on Vercel so the real API key stays server-side.
 */
export class GeminiLiveClient {
  constructor({
    voiceName = 'Kore',
    systemInstruction = '',
    directApiKey = '',
    onReady,
    onUserTranscript,
    onModelTranscript,
    onAudioChunk,
    onTurnComplete,
    onInterrupted,
    onError,
    onClose,
  }) {
    this.voiceName = voiceName
    this.systemInstruction = systemInstruction
    this.directApiKey = directApiKey
    this.onReady = onReady
    this.onUserTranscript = onUserTranscript
    this.onModelTranscript = onModelTranscript
    this.onAudioChunk = onAudioChunk
    this.onTurnComplete = onTurnComplete
    this.onInterrupted = onInterrupted
    this.onError = onError
    this.onClose = onClose
    this.ws = null
    this.ready = false
    this._readyResolve = null
    this._readyReject = null
  }

  async connect() {
    if (this.ready && this.ws?.readyState === WebSocket.OPEN) return

    let wsUrl = ''
    if (this.directApiKey) {
      wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(
        this.directApiKey
      )}`
    } else {
      const res = await fetch('/api/live-token', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data?.token) {
        throw new Error(data?.error || 'Could not obtain live voice token from /api/live-token.')
      }
      wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(
        data.token
      )}`
    }

    return new Promise((resolve, reject) => {
      this._readyResolve = resolve
      this._readyReject = reject

      const ws = new WebSocket(wsUrl)
      this.ws = ws

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            setup: {
              model: 'models/gemini-3.8-live',
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: this.voiceName },
                  },
                },
              },
              realtimeInputConfig: {
                automaticActivityDetection: {
                  disabled: false,
                  startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
                  endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
                  prefixPaddingMs: 120,
                  silenceDurationMs: 400,
                },
              },
              inputAudioTranscription: {},
              outputAudioTranscription: {},
              systemInstruction: {
                parts: [{ text: this.systemInstruction }],
              },
            },
          })
        )
      }

      ws.onmessage = async (ev) => {
        try {
          const raw = typeof ev.data === 'string' ? ev.data : await ev.data.text()
          const msg = JSON.parse(raw)

          if (msg.setupComplete) {
            this.ready = true
            this.onReady?.()
            this._readyResolve?.()
            this._readyResolve = null
            this._readyReject = null
            return
          }

          const sc = msg.serverContent
          if (!sc) return

          if (sc.interrupted) {
            this.onInterrupted?.()
          }

          if (sc.inputTranscription?.text) {
            this.onUserTranscript?.(sc.inputTranscription.text)
          }

          if (sc.outputTranscription?.text) {
            this.onModelTranscript?.(sc.outputTranscription.text)
          }

          if (sc.modelTurn?.parts) {
            for (const part of sc.modelTurn.parts) {
              if (part.inlineData?.data) {
                const rateMatch = String(part.inlineData.mimeType || '').match(/rate=(\d+)/)
                const rate = rateMatch ? Number(rateMatch[1]) : 24000
                this.onAudioChunk?.(part.inlineData.data, rate)
              }
            }
          }

          if (sc.turnComplete) {
            this.onTurnComplete?.()
          }
        } catch (err) {
          this.onError?.(err.message || 'Failed parsing live server frame.')
        }
      }

      ws.onerror = () => {
        const err = new Error('Live WebSocket connection error.')
        this._readyReject?.(err)
        this._readyResolve = null
        this._readyReject = null
        this.onError?.(err.message)
      }

      ws.onclose = (ev) => {
        this.ready = false
        if (this._readyReject) {
          this._readyReject(new Error(ev.reason || `Live connection closed (${ev.code})`))
          this._readyResolve = null
          this._readyReject = null
        }
        this.onClose?.(ev.code, ev.reason)
      }
    })
  }

  sendText(text) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    this.ws.send(
      JSON.stringify({
        clientContent: {
          turns: [{ role: 'user', parts: [{ text }] }],
          turnComplete: true,
        },
      })
    )
  }

  sendPcmAudio(base64Pcm) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    this.ws.send(
      JSON.stringify({
        realtimeInput: {
          audio: {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Pcm,
          },
        },
      })
    )
  }

  sendAudioStreamEnd() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    this.ws.send(
      JSON.stringify({
        realtimeInput: {
          audioStreamEnd: true,
        },
      })
    )
  }

  close() {
    this.ready = false
    if (this.ws) {
      try {
        this.ws.close()
      } catch {
        // ignore
      }
      this.ws = null
    }
  }
}
