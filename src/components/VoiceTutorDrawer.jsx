import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, Volume2, VolumeX, Send, X, KeyRound, MessageSquare,
  Loader2, Square, Trash2, GraduationCap, Radio, Check
} from 'lucide-react'
import { getCleanCodeString } from '../data/projectData'
import { blobToBase64, pcmBase64ToWavUrl, pickSupportedAudioMime } from '../utils/audioUtils'

const MODEL_CHAIN = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.5-flash']

const VOICES = [
  { id: 'Kore', label: 'Kore (Warm)' },
  { id: 'Puck', label: 'Puck (Friendly)' },
  { id: 'Zephyr', label: 'Zephyr (Clear)' },
  { id: 'Fenrir', label: 'Fenrir (Professor)' },
]

const STARTER_PROMPTS = [
  'Explain split() and [6:] simply',
  'Why does position start at -1?',
  'Quiz me like our CSCI 1380 professor',
  'Void vs value-returning functions in our code',
]

const CLIENT_SYSTEM_PROMPT = `You are a friendly, concise CSCI 1380 Python study tutor helping Jeremy Hernández, Sara Astorga, and Felix Martinez understand and present their Final Project Prompt #8 ("Student Club Member Directory").
- Keep answers short (2 to 4 sentences), clear, and natural so they sound great when spoken aloud.
- Reply in English by default, or Spanish if the student speaks/writes in Spanish.
- Stick strictly to basic Python they learned (lists, while, for, if/elif/else, functions, open/read/write/close, replace, split, [0:6] and [6:]). Never suggest try/except, lambdas, classes, or list comprehensions.
- If asked to quiz them like a professor, ask ONE focused question and give encouraging feedback when they answer.
Here is their exact code:
${getCleanCodeString()}`

function FormattedText({ text }) {
  const segments = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.startsWith('`') && seg.endsWith('`')) {
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 mx-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-emerald-300 font-mono text-[11.5px]"
            >
              {seg.slice(1, -1)}
            </code>
          )
        }
        if (seg.startsWith('**') && seg.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-white">
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
  text: 'Ready to study! Tap the microphone to speak naturally (works in Opera GX, Chrome, Safari & mobile), or click **Mock Professor** to practice answering presentation questions out loud.',
}

export default function VoiceTutorDrawer({ open, onClose, queuedQuestion, onClearQueued }) {
  const [messages, setMessages] = useState([WELCOME_MSG])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [meterLevels, setMeterLevels] = useState([20, 25, 30, 25, 20, 25, 20])
  const [voiceName, setVoiceName] = useState('Kore')
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [ttsLoadingId, setTtsLoadingId] = useState(null)
  const [playingId, setPlayingId] = useState(null)
  const [showKeyBox, setShowKeyBox] = useState(false)
  const [localKey, setLocalKey] = useState(() => sessionStorage.getItem('gemini_tutor_key') || '')
  const [errorMsg, setErrorMsg] = useState('')

  const mediaRecorderRef = useRef(null)
  const audioStreamRef = useRef(null)
  const chunksRef = useRef([])
  const cancelRecordingRef = useRef(false)
  const audioCtxRef = useRef(null)
  const rafRef = useRef(null)
  const timerRef = useRef(null)
  const audioElRef = useRef(null)
  const audioCacheRef = useRef(new Map())
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading, recording])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 220)
    } else {
      cleanupRecording(true)
      stopAudio()
    }
  }, [open])

  useEffect(() => {
    return () => {
      cleanupRecording(true)
      stopAudio()
      audioCacheRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  useEffect(() => {
    if (open && queuedQuestion) {
      sendTextMessage(queuedQuestion)
      onClearQueued?.()
    }
  }, [open, queuedQuestion])

  const getActiveLocalKey = () => localKey.trim() || import.meta.env.VITE_GEMINI_API_KEY || ''

  const stopAudio = () => {
    if (audioElRef.current) {
      audioElRef.current.pause()
      audioElRef.current.currentTime = 0
      audioElRef.current = null
    }
    setPlayingId(null)
    setTtsLoadingId(null)
  }

  const cleanupRecording = (cancel = false) => {
    cancelRecordingRef.current = cancel
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
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
    setMeterLevels([20, 25, 30, 25, 20, 25, 20])
  }

  // ---- Gemini Neural TTS (Studio Human Voice) ----
  const fetchNeuralAudioUrl = async (text, chosenVoice) => {
    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/[`*_#]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 900)

    const directKey = getActiveLocalKey()

    if (!directKey) {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice: chosenVoice }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'TTS failed')
      return pcmBase64ToWavUrl(data.audioBase64, data.sampleRate || 24000)
    }

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
                prebuiltVoiceConfig: { voiceName: chosenVoice },
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
    const rateMatch = String(inline.mimeType || '').match(/rate=(\d+)/)
    const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000
    return pcmBase64ToWavUrl(inline.data, sampleRate)
  }

  const playMessageAudio = async (text, msgId, force = false) => {
    if (!autoSpeak && !force) return
    stopAudio()

    const cacheKey = `${msgId}:${voiceName}`
    let wavUrl = audioCacheRef.current.get(cacheKey)

    try {
      if (!wavUrl) {
        setTtsLoadingId(msgId)
        wavUrl = await fetchNeuralAudioUrl(text, voiceName)
        audioCacheRef.current.set(cacheKey, wavUrl)
      }
      setTtsLoadingId(null)
      const audio = new Audio(wavUrl)
      audioElRef.current = audio
      setPlayingId(msgId)
      audio.onended = () => {
        setPlayingId(null)
        audioElRef.current = null
      }
      audio.onerror = () => {
        setPlayingId(null)
        audioElRef.current = null
      }
      await audio.play()
    } catch (err) {
      setTtsLoadingId(null)
      setPlayingId(null)
      if (force) setErrorMsg(`Voice playback error: ${err.message}`)
    }
  }

  // ---- Gemini Chat / Audio Understanding ----
  const callGeminiDirect = async (apiKey, payload, history) => {
    const isAudio = Boolean(payload.audioBase64)
    const userParts = isAudio
      ? [
          {
            inlineData: {
              mimeType: (payload.audioMimeType || 'audio/webm').split(';')[0],
              data: payload.audioBase64,
            },
          },
          {
            text: 'Listen to the student speaking. Return ONLY valid JSON with two keys: "transcript" (exact words the student spoke) and "reply" (your helpful 2-4 sentence tutor answer in the same language they spoke). If silent or unclear, set transcript to "(unclear audio)" and ask them politely to try again.',
          },
        ]
      : [{ text: payload.message }]

    const contents = [
      ...history.slice(-10).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }],
      })),
      { role: 'user', parts: userParts },
    ]

    let lastErr = 'Gemini API request failed.'
    for (const model of MODEL_CHAIN) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          apiKey
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: CLIENT_SYSTEM_PROMPT }] },
            contents,
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 420,
              ...(isAudio ? { responseMimeType: 'application/json' } : {}),
            },
          }),
        }
      )
      const data = await res.json()
      if (res.ok) {
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.'
        if (isAudio) {
          try {
            const parsed = JSON.parse(rawText)
            return {
              transcript: parsed.transcript || '(voice question)',
              reply: parsed.reply || rawText,
            }
          } catch {
            return { transcript: '(voice question)', reply: rawText }
          }
        }
        return { reply: rawText }
      }
      lastErr = data?.error?.message || `HTTP ${res.status}`
    }
    throw new Error(lastErr)
  }

  const sendTextMessage = async (textToSend) => {
    const trimmed = textToSend.trim()
    if (!trimmed || loading) return

    stopAudio()
    setErrorMsg('')
    const historySnapshot = [...messages]
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', text: trimmed }])
    setInput('')
    setLoading(true)

    try {
      const directKey = getActiveLocalKey()
      let reply = ''

      if (!directKey) {
        const res = await fetch('/api/tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, history: historySnapshot }),
        })
        const data = await res.json()
        if (!res.ok) {
          setShowKeyBox(true)
          throw new Error(data?.error || 'Could not reach /api/tutor.')
        }
        reply = data.reply
      } else {
        const result = await callGeminiDirect(directKey, { message: trimmed }, historySnapshot)
        reply = result.reply
      }

      const replyId = Date.now() + 1
      setMessages((prev) => [...prev, { id: replyId, role: 'assistant', text: reply }])
      playMessageAudio(reply, replyId)
    } catch (err) {
      setErrorMsg(err.message || 'Could not reach Gemini.')
    } finally {
      setLoading(false)
    }
  }

  const sendAudioBlob = async (blob, mimeType) => {
    stopAudio()
    setErrorMsg('')
    const placeholderId = Date.now()
    const historySnapshot = [...messages]
    setMessages((prev) => [
      ...prev,
      { id: placeholderId, role: 'user', text: 'Transcribing your voice...' },
    ])
    setLoading(true)

    try {
      const audioBase64 = await blobToBase64(blob)
      const directKey = getActiveLocalKey()
      let result

      if (!directKey) {
        const res = await fetch('/api/tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64,
            audioMimeType: mimeType || 'audio/webm',
            history: historySnapshot,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Voice request failed.')
        result = data
      } else {
        result = await callGeminiDirect(
          directKey,
          { audioBase64, audioMimeType: mimeType || 'audio/webm' },
          historySnapshot
        )
      }

      const replyId = Date.now() + 1
      setMessages((prev) => [
        ...prev.map((m) =>
          m.id === placeholderId
            ? { ...m, text: result.transcript || '(voice question)' }
            : m
        ),
        { id: replyId, role: 'assistant', text: result.reply },
      ])
      playMessageAudio(result.reply, replyId)
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== placeholderId))
      setErrorMsg(err.message || 'Could not process voice recording.')
    } finally {
      setLoading(false)
    }
  }

  // ---- Universal MediaRecorder Microphone (Works in Opera GX, Chrome, Firefox, Safari) ----
  const startRecording = async () => {
    if (loading) return
    stopAudio()
    setErrorMsg('')

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setErrorMsg('Microphone recording requires HTTPS and a modern browser.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream
      chunksRef.current = []
      cancelRecordingRef.current = false

      const mime = pickSupportedAudioMime()
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const wasCanceled = cancelRecordingRef.current
        const chunks = chunksRef.current
        const finalMime = recorder.mimeType || mime || 'audio/webm'
        if (!wasCanceled && chunks.length > 0) {
          const blob = new Blob(chunks, { type: finalMime })
          if (blob.size > 800) {
            sendAudioBlob(blob, finalMime)
          } else {
            setErrorMsg('Recording was too short—tap the mic, speak, then tap Send.')
          }
        }
      }

      // Live voice volume meter via Web Audio API
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        const ctx = new AudioCtx()
        audioCtxRef.current = ctx
        const src = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 64
        src.connect(analyser)
        const freqData = new Uint8Array(analyser.frequencyBinCount)

        const tick = () => {
          analyser.getByteFrequencyData(freqData)
          const bars = [1, 3, 5, 7, 9, 11, 13].map((idx) =>
            Math.max(18, Math.min(100, Math.round((freqData[idx] / 255) * 100)))
          )
          setMeterLevels(bars)
          rafRef.current = requestAnimationFrame(tick)
        }
        tick()
      } catch {
        // Visualizer optional; recording still works
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
        setErrorMsg(
          'Microphone permission was blocked. Click the lock/mic icon in your browser address bar, allow Microphone, and try again.'
        )
      } else {
        setErrorMsg(`Could not start microphone: ${err?.message || err}`)
      }
    }
  }

  const stopAndSendRecording = () => {
    cleanupRecording(false)
  }

  const cancelRecording = () => {
    cleanupRecording(true)
  }

  const saveLocalKey = (val) => {
    setLocalKey(val)
    if (val.trim()) sessionStorage.setItem('gemini_tutor_key', val.trim())
    else sessionStorage.removeItem('gemini_tutor_key')
  }

  const clearChat = () => {
    stopAudio()
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
              stopAudio()
              onClose()
            }}
            className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-[440px] bg-[#0d0f14] border-l border-zinc-800/90 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800/90 bg-zinc-900/75">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white leading-tight">
                      Voice Code Tutor
                    </h3>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> HD Voice
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono">Gemini Neural Voice · Audio &amp; Chat</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    if (autoSpeak) stopAudio()
                    setAutoSpeak((v) => !v)
                  }}
                  title={autoSpeak ? 'Mute auto-speak' : 'Enable auto-speak'}
                  className={`p-1.5 rounded-lg border cursor-pointer transition ${
                    autoSpeak
                      ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                <button
                  onClick={clearChat}
                  title="Clear conversation"
                  className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowKeyBox((v) => !v)}
                  title="Local Gemini API Key (optional)"
                  className={`p-1.5 rounded-lg border cursor-pointer transition ${
                    showKeyBox || localKey
                      ? 'bg-amber-500/15 border-amber-500/35 text-amber-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    cleanupRecording(true)
                    stopAudio()
                    onClose()
                  }}
                  title="Close (Esc)"
                  className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Voice Picker & Mock Professor Bar */}
            <div className="px-4 py-2.5 border-b border-zinc-800/70 bg-zinc-950/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-500 font-medium">Voice:</span>
                <select
                  value={voiceName}
                  onChange={(e) => {
                    stopAudio()
                    setVoiceName(e.target.value)
                  }}
                  aria-label="Tutor voice"
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-[11px] font-semibold text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() =>
                  sendTextMessage(
                    'Act like our CSCI 1380 professor during our final presentation. Ask me ONE short question about our Student Club Member Directory code and wait for my answer.'
                  )
                }
                disabled={loading || recording}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/15 border border-amber-500/35 text-amber-300 hover:bg-amber-500/25 disabled:opacity-40 cursor-pointer transition shrink-0"
              >
                <GraduationCap className="w-3.5 h-3.5" /> Mock Professor
              </button>
            </div>

            {/* Optional Local Key Drawer */}
            <AnimatePresence>
              {showKeyBox && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-zinc-800 bg-zinc-950/90"
                >
                  <div className="p-4 space-y-2">
                    <div className="text-xs font-semibold text-amber-300">
                      Local Override Key (stored only in this browser tab)
                    </div>
                    <input
                      type="password"
                      value={localKey}
                      onChange={(e) => saveLocalKey(e.target.value)}
                      placeholder="Paste Gemini API key..."
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 focus:outline-none rounded-lg px-3 py-1.5 font-mono text-xs text-white"
                    />
                    <p className="text-[11px] text-zinc-400">
                      On Vercel, <code className="text-zinc-200">GEMINI_API_KEY</code> in Environment Variables powers both <code className="text-zinc-200">/api/tutor</code> and <code className="text-zinc-200">/api/tts</code> securely.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {messages.map((m) => {
                const isPlaying = playingId === m.id
                const isLoadingTts = ttsLoadingId === m.id
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                        m.role === 'user'
                          ? 'bg-emerald-600 text-white rounded-br-sm'
                          : 'bg-zinc-900/90 border border-zinc-800 text-zinc-200 rounded-bl-sm'
                      }`}
                    >
                      <FormattedText text={m.text} />
                    </div>
                    {m.role === 'assistant' && (
                      <button
                        onClick={() =>
                          isPlaying ? stopAudio() : playMessageAudio(m.text, m.id, true)
                        }
                        disabled={isLoadingTts}
                        className="mt-1 ml-1 inline-flex items-center gap-1 text-[10.5px] font-medium text-zinc-500 hover:text-emerald-300 disabled:opacity-60 cursor-pointer transition"
                      >
                        {isLoadingTts ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-emerald-400" /> Generating HD voice...
                          </>
                        ) : isPlaying ? (
                          <>
                            <Square className="w-2.5 h-2.5 fill-current text-emerald-400" /> Stop audio
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" /> Listen ({voiceName})
                          </>
                        )}
                      </button>
                    )}
                  </motion.div>
                )
              })}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-zinc-400 px-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  Thinking...
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/35 text-xs text-rose-200">
                  {errorMsg}
                </div>
              )}
            </div>

            {/* Starter Chips */}
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendTextMessage(p)}
                  disabled={loading || recording}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 text-[11px] text-zinc-300 hover:text-white cursor-pointer transition"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Active Speaking Banner */}
            {playingId !== null && !recording && (
              <div className="mx-4 mb-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center gap-2.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <div className="flex items-end gap-0.5 h-3.5">
                    {[0, 1, 2, 3, 4].map((bar) => (
                      <motion.span
                        key={bar}
                        animate={{ height: ['25%', '100%', '35%'] }}
                        transition={{ repeat: Infinity, duration: 0.55, delay: bar * 0.1 }}
                        className="w-1 bg-emerald-400 rounded-full"
                      />
                    ))}
                  </div>
                  <span className="font-semibold">Speaking ({voiceName})...</span>
                </div>
                <button
                  onClick={stopAudio}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-200 hover:text-white cursor-pointer"
                >
                  <Square className="w-3 h-3" /> Stop
                </button>
              </div>
            )}

            {/* Input Area OR Live Recording Bar */}
            {recording ? (
              <div className="p-3.5 border-t border-rose-500/35 bg-rose-950/25 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  <span className="font-mono text-xs font-bold text-rose-200">
                    {formatTimer(recordSeconds)}
                  </span>
                  <div className="flex items-end gap-1 h-5">
                    {meterLevels.map((lvl, idx) => (
                      <span
                        key={idx}
                        style={{ height: `${lvl}%` }}
                        className="w-1 bg-rose-400 rounded-full transition-all duration-75"
                      />
                    ))}
                  </div>
                  <span className="text-xs text-rose-200/80 truncate">Recording...</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={cancelRecording}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={stopAndSendRecording}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition shadow-md shadow-emerald-600/25"
                  >
                    <Check className="w-3.5 h-3.5" /> Send Voice
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  sendTextMessage(input)
                }}
                className="p-3.5 border-t border-zinc-800/90 bg-zinc-900/75 flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={loading}
                  title="Tap to record your voice"
                  className="p-2.5 rounded-xl border bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-emerald-500/60 hover:text-emerald-300 disabled:opacity-40 cursor-pointer transition shrink-0"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tap mic to speak or type here..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white"
                />

                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white cursor-pointer transition shrink-0"
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
