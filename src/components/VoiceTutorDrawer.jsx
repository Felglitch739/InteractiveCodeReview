import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, Volume2, VolumeX, Send, X, KeyRound, Loader2, Square, Trash2, Check
} from 'lucide-react'
import { getCleanCodeString } from '../data/projectData'
import { GeminiLiveClient, PcmStreamPlayer } from '../utils/liveAudioEngine'
import { blobToBase64, pickSupportedAudioMime } from '../utils/audioUtils'

const TRANSCRIBE_MODELS = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.5-flash']

const VOICES = [
  { id: 'Kore', label: 'Kore' },
  { id: 'Puck', label: 'Puck' },
  { id: 'Zephyr', label: 'Zephyr' },
  { id: 'Fenrir', label: 'Fenrir' },
]

const STARTER_PROMPTS = [
  'Explain split() and [6:] simply',
  'Why does position start at -1?',
  'Difference between void and return functions',
]

const LIVE_SYSTEM_INSTRUCTION = `You are a calm, concise CSCI 1380 Python study tutor helping Jeremy Hernández, Sara Astorga, and Felix Martinez understand and present their Final Project Prompt #8 ("Student Club Member Directory").
- Keep answers natural, clear, and concise (2 to 4 sentences).
- Reply in English by default, or Spanish if the student speaks or writes in Spanish.
- Stick strictly to basic Python from CSCI 1380 (lists, while, for, if/elif/else, functions, open/read/write/close, replace, split, string slicing [0:6] and [6:]). Never suggest try/except, lambdas, classes, or list comprehensions.
Here is their exact code:
${getCleanCodeString()}`

function FormattedText({ text, isUser }) {
  const segments = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.startsWith('`') && seg.endsWith('`')) {
          return (
            <code
              key={i}
              className={`px-1.5 py-0.5 mx-0.5 rounded font-mono text-[11.5px] ${
                isUser ? 'bg-black/15 dark:bg-black/25' : 'neu-inset text-ink'
              }`}
            >
              {seg.slice(1, -1)}
            </code>
          )
        }
        if (seg.startsWith('**') && seg.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold">
              {seg.slice(2, -2)}
            </strong>
          )
        }
        return <span key={i}>{seg}</span>
      })}
    </>
  )
}

const WELCOME_MSG = {
  id: 1,
  role: 'assistant',
  text: 'Ask anything about your Student Club Member Directory code. Tap the microphone below to speak, or type a question.',
}

export default function VoiceTutorDrawer({ open, onClose, queuedQuestion, onClearQueued }) {
  const [messages, setMessages] = useState([WELCOME_MSG])
  const [input, setInput] = useState('')
  const [voiceName, setVoiceName] = useState('Kore')
  const [speakerMuted, setSpeakerMuted] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [liveConnected, setLiveConnected] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [modelSpeaking, setModelSpeaking] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [meterLevels, setMeterLevels] = useState([18, 22, 26, 22, 18, 22, 18])
  const [showKeyBox, setShowKeyBox] = useState(false)
  const [localKey, setLocalKey] = useState(() => sessionStorage.getItem('gemini_tutor_key') || '')
  const [errorMsg, setErrorMsg] = useState('')

  const liveClientRef = useRef(null)
  const playerRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioStreamRef = useRef(null)
  const chunksRef = useRef([])
  const cancelRecRef = useRef(false)
  const meterCtxRef = useRef(null)
  const rafRef = useRef(null)
  const timerRef = useRef(null)
  const activeModelMsgIdRef = useRef(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, thinking, recording])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200)
    } else {
      cleanupRecording(true)
      disconnectAll()
    }
  }, [open])

  useEffect(
    () => () => {
      cleanupRecording(true)
      disconnectAll()
    },
    []
  )

  useEffect(() => {
    if (open && queuedQuestion) {
      sendTextMessage(queuedQuestion)
      onClearQueued?.()
    }
  }, [open, queuedQuestion])

  const getDirectKey = () => localKey.trim() || import.meta.env.VITE_GEMINI_API_KEY || ''

  const ensurePlayer = () => {
    if (!playerRef.current) {
      playerRef.current = new PcmStreamPlayer((playing) => {
        setModelSpeaking(playing)
      })
    }
    playerRef.current.setMuted(speakerMuted)
    playerRef.current.ensureContext()
    return playerRef.current
  }

  const cleanupRecording = (cancel = false) => {
    cancelRecRef.current = cancel
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (meterCtxRef.current) {
      meterCtxRef.current.close().catch(() => {})
      meterCtxRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop())
      audioStreamRef.current = null
    }
    setRecording(false)
    setRecordSeconds(0)
    setMeterLevels([18, 22, 26, 22, 18, 22, 18])
  }

  const disconnectAll = () => {
    liveClientRef.current?.close()
    liveClientRef.current = null
    setLiveConnected(false)
    setConnecting(false)
    setThinking(false)

    playerRef.current?.close()
    playerRef.current = null
    setModelSpeaking(false)

    activeModelMsgIdRef.current = null
  }

  const ensureLiveSession = async (chosenVoice = voiceName) => {
    if (liveClientRef.current?.ready) return liveClientRef.current

    setConnecting(true)
    setErrorMsg('')
    ensurePlayer()

    const client = new GeminiLiveClient({
      voiceName: chosenVoice,
      systemInstruction: LIVE_SYSTEM_INSTRUCTION,
      directApiKey: getDirectKey(),
      onReady: () => {
        setLiveConnected(true)
        setConnecting(false)
      },
      onModelTranscript: (chunk) => {
        if (!chunk) return
        setThinking(false)
        if (!activeModelMsgIdRef.current) {
          const newId = Date.now() + Math.random()
          activeModelMsgIdRef.current = newId
          setMessages((prev) =>
            prev.some((m) => m.id === newId)
              ? prev
              : [...prev, { id: newId, role: 'assistant', text: chunk.trimStart() }]
          )
        } else {
          const targetId = activeModelMsgIdRef.current
          setMessages((prev) =>
            prev.map((m) => (m.id === targetId ? { ...m, text: m.text + chunk } : m))
          )
        }
      },
      onAudioChunk: (b64, rate) => {
        setThinking(false)
        playerRef.current?.enqueueBase64(b64, rate)
      },
      onInterrupted: () => {
        playerRef.current?.interrupt()
        activeModelMsgIdRef.current = null
        setThinking(false)
      },
      onTurnComplete: () => {
        setThinking(false)
        activeModelMsgIdRef.current = null
      },
      onError: (msg) => {
        setErrorMsg(msg)
        setConnecting(false)
        setThinking(false)
      },
      onClose: () => {
        setLiveConnected(false)
        setConnecting(false)
        setThinking(false)
        liveClientRef.current = null
      },
    })

    liveClientRef.current = client
    try {
      await client.connect()
      return client
    } catch (err) {
      setConnecting(false)
      setLiveConnected(false)
      liveClientRef.current = null
      if (!getDirectKey()) setShowKeyBox(true)
      setErrorMsg(err.message || 'Could not connect to voice service.')
      throw err
    }
  }

  // Transcribe recorded voice blob accurately via /api/transcribe (or direct Gemini locally)
  const transcribeAudioBlob = async (blob, mimeType) => {
    const audioBase64 = await blobToBase64(blob)
    const directKey = getDirectKey()

    if (!directKey) {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64, audioMimeType: mimeType || 'audio/webm' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Could not transcribe voice.')
      return (data.transcript || '').trim()
    }

    const cleanMime = String(mimeType || 'audio/webm').split(';')[0]
    let lastErr = 'Could not transcribe voice.'
    for (const model of TRANSCRIBE_MODELS) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          directKey
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { inlineData: { mimeType: cleanMime, data: audioBase64 } },
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
      const data = await res.json()
      if (res.ok) {
        return (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim()
      }
      lastErr = data?.error?.message || `HTTP ${res.status}`
    }
    throw new Error(lastErr)
  }

  const handleRecordedVoice = async (blob, mimeType) => {
    setErrorMsg('')
    playerRef.current?.interrupt()
    activeModelMsgIdRef.current = null

    const placeholderId = Date.now() + Math.random()
    setMessages((prev) => [
      ...prev,
      { id: placeholderId, role: 'user', text: 'Listening to your voice...' },
    ])
    setThinking(true)

    try {
      // Transcribe audio AND ensure Gemini 3.8 Live is ready in parallel for fastest response
      const [transcript, client] = await Promise.all([
        transcribeAudioBlob(blob, mimeType),
        ensureLiveSession(),
      ])

      if (!transcript) {
        setMessages((prev) => prev.filter((m) => m.id !== placeholderId))
        setThinking(false)
        setErrorMsg('No speech detected—tap the mic, speak clearly, then tap Send.')
        return
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === placeholderId ? { ...m, text: transcript } : m))
      )
      client.sendText(transcript)
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== placeholderId))
      setThinking(false)
      setErrorMsg(err.message || 'Could not process voice message.')
    }
  }

  const startRecording = async () => {
    if (connecting || thinking) return
    setErrorMsg('')
    ensurePlayer()
    playerRef.current?.interrupt()

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setErrorMsg('Microphone recording requires HTTPS and a modern browser.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream
      chunksRef.current = []
      cancelRecRef.current = false

      const mime = pickSupportedAudioMime()
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const wasCanceled = cancelRecRef.current
        const chunks = chunksRef.current
        const finalMime = recorder.mimeType || mime || 'audio/webm'
        if (!wasCanceled && chunks.length > 0) {
          const blob = new Blob(chunks, { type: finalMime })
          if (blob.size > 600) {
            handleRecordedVoice(blob, finalMime)
          } else {
            setErrorMsg('Recording was too short—speak your question and tap Send.')
          }
        }
      }

      // Live 7-bar mic volume meter
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        const ctx = new AudioCtx()
        meterCtxRef.current = ctx
        const src = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 64
        src.connect(analyser)
        const freq = new Uint8Array(analyser.frequencyBinCount)

        const tick = () => {
          analyser.getByteFrequencyData(freq)
          const bars = [1, 3, 5, 7, 9, 11, 13].map((i) =>
            Math.max(16, Math.min(100, Math.round((freq[i] / 255) * 100)))
          )
          setMeterLevels(bars)
          rafRef.current = requestAnimationFrame(tick)
        }
        tick()
      } catch {
        // optional visual meter
      }

      recorder.start()
      setRecording(true)
      setRecordSeconds(0)
      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => {
          if (s >= 29) {
            cleanupRecording(false)
            return 30
          }
          return s + 1
        })
      }, 1000)
    } catch (err) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setErrorMsg('Microphone permission is blocked. Allow microphone access in your browser address bar.')
      } else {
        setErrorMsg(err?.message || 'Could not start microphone.')
      }
    }
  }

  const sendTextMessage = async (textToSend) => {
    const trimmed = textToSend.trim()
    if (!trimmed || connecting) return

    setErrorMsg('')
    ensurePlayer()
    playerRef.current?.interrupt()
    activeModelMsgIdRef.current = null

    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), role: 'user', text: trimmed }])
    setInput('')
    setThinking(true)

    try {
      const client = await ensureLiveSession()
      client.sendText(trimmed)
    } catch {
      setThinking(false)
    }
  }

  const handleVoiceChange = (nextVoice) => {
    setVoiceName(nextVoice)
    if (liveConnected) disconnectAll()
  }

  const saveLocalKey = (val) => {
    setLocalKey(val)
    if (val.trim()) sessionStorage.setItem('gemini_tutor_key', val.trim())
    else sessionStorage.removeItem('gemini_tutor_key')
  }

  const clearChat = () => {
    cleanupRecording(true)
    disconnectAll()
    setErrorMsg('')
    setMessages([WELCOME_MSG])
  }

  const formatTimer = (sec) => `0:${String(sec).padStart(2, '0')}`

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              cleanupRecording(true)
              disconnectAll()
              onClose()
            }}
            className="fixed inset-0 bg-black/35 backdrop-blur-xs z-50"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--divider)' }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-[420px] border-l z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b neu-divider">
              <div>
                <h3 className="text-sm font-semibold text-ink">Voice Tutor</h3>
                <p className="text-[11px] text-ink-muted">
                  {connecting ? 'Connecting...' : liveConnected ? 'Connected · Live Voice' : 'Ready'}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <select
                  value={voiceName}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                  aria-label="Tutor voice"
                  className="neu-btn rounded-lg px-2.5 py-1.5 text-[11px] font-semibold focus:outline-none cursor-pointer"
                >
                  {VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    const next = !speakerMuted
                    setSpeakerMuted(next)
                    playerRef.current?.setMuted(next)
                  }}
                  title={speakerMuted ? 'Unmute audio' : 'Mute audio'}
                  className="neu-btn p-2 rounded-lg text-ink-2 hover:text-ink cursor-pointer"
                >
                  {speakerMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={clearChat}
                  title="Clear chat"
                  className="neu-btn p-2 rounded-lg text-ink-2 hover:text-ink cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setShowKeyBox((v) => !v)}
                  title="Local API key"
                  className="neu-btn p-2 rounded-lg text-ink-2 hover:text-ink cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    cleanupRecording(true)
                    disconnectAll()
                    onClose()
                  }}
                  title="Close"
                  className="neu-btn p-2 rounded-lg text-ink-2 hover:text-ink cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Optional Local Key Box */}
            <AnimatePresence>
              {showKeyBox && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b neu-divider"
                >
                  <div className="p-4 space-y-2">
                    <div className="text-[11px] font-semibold text-ink-muted">
                      Local API Key Override (session only)
                    </div>
                    <input
                      type="password"
                      value={localKey}
                      onChange={(e) => saveLocalKey(e.target.value)}
                      placeholder="Paste Gemini API key..."
                      className="neu-inset w-full rounded-xl px-3 py-2 font-mono text-xs text-ink focus:outline-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3.5">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[86%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'neu-btn-primary rounded-br-sm'
                        : 'neu-card-sm text-ink rounded-bl-sm'
                    }`}
                  >
                    <FormattedText text={m.text} isUser={m.role === 'user'} />
                  </div>
                </motion.div>
              ))}

              {thinking && (
                <div className="flex items-center gap-2 text-xs text-ink-muted px-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}

              {errorMsg && (
                <div className="state-err p-3 rounded-xl text-xs">
                  {errorMsg}
                </div>
              )}
            </div>

            {/* Speaking Strip */}
            {modelSpeaking && !recording && (
              <div className="mx-5 mb-2.5 px-3.5 py-2 rounded-xl neu-inset flex items-center justify-between text-xs text-ink">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-end gap-0.5 h-3.5">
                    {[0, 1, 2, 3, 4].map((bar) => (
                      <motion.span
                        key={bar}
                        animate={{ height: ['25%', '100%', '35%'] }}
                        transition={{ repeat: Infinity, duration: 0.5, delay: bar * 0.08 }}
                        style={{ backgroundColor: 'var(--text-primary)' }}
                        className="w-[3px] rounded-full"
                      />
                    ))}
                  </div>
                  <span className="font-medium text-[12px]">Speaking ({voiceName})</span>
                </div>

                <button
                  onClick={() => playerRef.current?.interrupt()}
                  className="neu-btn inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer"
                >
                  <Square className="w-2.5 h-2.5 fill-current" /> Stop
                </button>
              </div>
            )}

            {/* Starter Prompts */}
            <div className="px-5 pb-2.5 flex flex-wrap gap-1.5">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendTextMessage(p)}
                  disabled={connecting || recording}
                  className="neu-btn px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-ink-2 hover:text-ink disabled:opacity-40 cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Bottom Input Bar OR Active Recording Bar */}
            {recording ? (
              <div className="p-4 border-t neu-divider flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  <span className="font-mono text-xs font-semibold text-ink">
                    {formatTimer(recordSeconds)}
                  </span>
                  <div className="flex items-end gap-0.5 h-5">
                    {meterLevels.map((lvl, idx) => (
                      <span
                        key={idx}
                        style={{ height: `${lvl}%` }}
                        className="w-[3px] bg-rose-500 rounded-full transition-all duration-75"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => cleanupRecording(true)}
                    className="neu-btn px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => cleanupRecording(false)}
                    className="neu-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Send
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  sendTextMessage(input)
                }}
                className="p-4 border-t neu-divider flex items-center gap-2.5"
              >
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={connecting || thinking}
                  title="Record your voice question"
                  className="neu-btn p-2.5 rounded-xl disabled:opacity-40 cursor-pointer shrink-0"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="neu-inset flex-1 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={connecting || !input.trim()}
                  className="neu-btn-primary p-2.5 rounded-xl disabled:opacity-35 cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
