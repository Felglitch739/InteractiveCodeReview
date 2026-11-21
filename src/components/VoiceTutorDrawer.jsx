import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Volume2, VolumeX, Send, X, KeyRound, MessageSquare,
  Loader2, Square, Trash2, GraduationCap, PhoneCall, PhoneOff, Radio
} from 'lucide-react'
import { getCleanCodeString } from '../data/projectData'
import { GeminiLiveClient, MicPcmStreamer, PcmStreamPlayer } from '../utils/liveAudioEngine'

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

const LIVE_SYSTEM_INSTRUCTION = `You are a friendly, fast CSCI 1380 Python voice tutor helping Jeremy Hernández, Sara Astorga, and Felix Martinez understand and present their Final Project Prompt #8 ("Student Club Member Directory").
- Keep spoken answers natural, warm, and short (2 to 4 sentences).
- Reply in English by default, or Spanish if the student speaks or writes in Spanish.
- Stick strictly to basic Python from CSCI 1380 (lists, while, for, if/elif/else, functions, open/read/write/close, replace, split, string slicing [0:6] and [6:]). Never suggest try/except, lambdas, classes, or list comprehensions.
- When acting as a mock CSCI 1380 professor, ask ONE short presentation question and wait for their answer, then give quick encouraging feedback.
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
  text: 'Powered by **Gemini 3.8 Live**! Tap **Start Live Voice** to talk in real time like a phone call—no waiting for audio to load—or type any question below.',
}

export default function VoiceTutorDrawer({ open, onClose, queuedQuestion, onClearQueued }) {
  const [messages, setMessages] = useState([WELCOME_MSG])
  const [input, setInput] = useState('')
  const [voiceName, setVoiceName] = useState('Kore')
  const [speakerMuted, setSpeakerMuted] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [liveConnected, setLiveConnected] = useState(false)
  const [micActive, setMicActive] = useState(false)
  const [micMuted, setMicMuted] = useState(false)
  const [modelSpeaking, setModelSpeaking] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [meterLevels, setMeterLevels] = useState([18, 22, 26, 22, 18, 22, 18])
  const [showKeyBox, setShowKeyBox] = useState(false)
  const [localKey, setLocalKey] = useState(() => sessionStorage.getItem('gemini_tutor_key') || '')
  const [errorMsg, setErrorMsg] = useState('')

  const liveClientRef = useRef(null)
  const playerRef = useRef(null)
  const micRef = useRef(null)
  const activeUserMsgIdRef = useRef(null)
  const activeModelMsgIdRef = useRef(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, thinking, micActive])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 220)
    } else {
      disconnectAll()
    }
  }, [open])

  useEffect(() => {
    return () => disconnectAll()
  }, [])

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

  const disconnectAll = () => {
    micRef.current?.stop()
    micRef.current = null
    setMicActive(false)
    setMicMuted(false)

    liveClientRef.current?.close()
    liveClientRef.current = null
    setLiveConnected(false)
    setConnecting(false)
    setThinking(false)

    playerRef.current?.close()
    playerRef.current = null
    setModelSpeaking(false)

    activeUserMsgIdRef.current = null
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
      onUserTranscript: (chunk) => {
        activeModelMsgIdRef.current = null
        setMessages((prev) => {
          if (activeUserMsgIdRef.current) {
            return prev.map((m) =>
              m.id === activeUserMsgIdRef.current ? { ...m, text: m.text + chunk } : m
            )
          }
          const newId = Date.now() + Math.random()
          activeUserMsgIdRef.current = newId
          return [...prev, { id: newId, role: 'user', text: chunk.trimStart() }]
        })
      },
      onModelTranscript: (chunk) => {
        setThinking(false)
        activeUserMsgIdRef.current = null
        setMessages((prev) => {
          if (activeModelMsgIdRef.current) {
            return prev.map((m) =>
              m.id === activeModelMsgIdRef.current ? { ...m, text: m.text + chunk } : m
            )
          }
          const newId = Date.now() + Math.random()
          activeModelMsgIdRef.current = newId
          return [...prev, { id: newId, role: 'assistant', text: chunk.trimStart() }]
        })
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
        activeUserMsgIdRef.current = null
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
        micRef.current?.stop()
        micRef.current = null
        setMicActive(false)
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
      setErrorMsg(err.message || 'Could not connect to Gemini 3.8 Live.')
      throw err
    }
  }

  const startLiveCall = async () => {
    setErrorMsg('')
    try {
      const client = await ensureLiveSession()
      if (!micRef.current) {
        const mic = new MicPcmStreamer({
          onChunk: (b64) => client.sendPcmAudio(b64),
          onLevels: (bars) => setMeterLevels(bars),
        })
        await mic.start()
        micRef.current = mic
      }
      setMicActive(true)
      setMicMuted(false)
    } catch (err) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setErrorMsg(
          'Microphone permission was blocked. Click the lock/mic icon in your address bar, allow Microphone, and try again.'
        )
      } else if (!errorMsg) {
        setErrorMsg(err?.message || 'Could not start live microphone.')
      }
    }
  }

  const stopLiveCall = () => {
    disconnectAll()
  }

  const toggleMicMute = () => {
    if (!micRef.current) return
    const next = !micMuted
    setMicMuted(next)
    micRef.current.setMuted(next)
  }

  const sendTextMessage = async (textToSend) => {
    const trimmed = textToSend.trim()
    if (!trimmed || connecting) return

    setErrorMsg('')
    playerRef.current?.interrupt()
    activeUserMsgIdRef.current = null
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
    if (liveConnected || micActive) {
      const wasInCall = micActive
      disconnectAll()
      if (wasInCall) {
        setTimeout(() => {
          ensureLiveSession(nextVoice)
            .then(async (client) => {
              const mic = new MicPcmStreamer({
                onChunk: (b64) => client.sendPcmAudio(b64),
                onLevels: (bars) => setMeterLevels(bars),
              })
              await mic.start()
              micRef.current = mic
              setMicActive(true)
            })
            .catch(() => {})
        }, 120)
      }
    }
  }

  const saveLocalKey = (val) => {
    setLocalKey(val)
    if (val.trim()) sessionStorage.setItem('gemini_tutor_key', val.trim())
    else sessionStorage.removeItem('gemini_tutor_key')
  }

  const clearChat = () => {
    disconnectAll()
    setErrorMsg('')
    setMessages([WELCOME_MSG])
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              disconnectAll()
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
                      Live Voice Tutor
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        liveConnected
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          liveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                        }`}
                      />
                      {connecting ? 'Connecting' : liveConnected ? 'LIVE' : 'Standby'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    gemini-3.8-live · Real-time Audio
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const next = !speakerMuted
                    setSpeakerMuted(next)
                    playerRef.current?.setMuted(next)
                  }}
                  title={speakerMuted ? 'Unmute tutor voice' : 'Mute tutor voice'}
                  className={`p-1.5 rounded-lg border cursor-pointer transition ${
                    !speakerMuted
                      ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  {speakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={clearChat}
                  title="Reset session"
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
                    disconnectAll()
                    onClose()
                  }}
                  title="Close (Esc)"
                  className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Voice Selector + Mock Professor */}
            <div className="px-4 py-2.5 border-b border-zinc-800/70 bg-zinc-950/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-500 font-medium">Voice:</span>
                <select
                  value={voiceName}
                  onChange={(e) => handleVoiceChange(e.target.value)}
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
                disabled={connecting}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/15 border border-amber-500/35 text-amber-300 hover:bg-amber-500/25 disabled:opacity-40 cursor-pointer transition shrink-0"
              >
                <GraduationCap className="w-3.5 h-3.5" /> Mock Professor
              </button>
            </div>

            {/* Live Voice Call Hero Bar */}
            <div className="px-4 py-3 border-b border-zinc-800/80 bg-[#0b0d12]">
              {!micActive ? (
                <button
                  onClick={startLiveCall}
                  disabled={connecting}
                  className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-lg shadow-emerald-600/25 cursor-pointer transition"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Connecting to Gemini 3.8 Live...
                    </>
                  ) : (
                    <>
                      <PhoneCall className="w-4 h-4" /> Start Live Voice Call (Talk Naturally)
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/35">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                    <div className="flex items-end gap-0.5 h-5">
                      {meterLevels.map((lvl, idx) => (
                        <span
                          key={idx}
                          style={{ height: `${lvl}%` }}
                          className={`w-1 rounded-full transition-all duration-75 ${
                            micMuted ? 'bg-zinc-600' : 'bg-emerald-400'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-emerald-200 truncate">
                      {micMuted
                        ? 'Mic muted'
                        : modelSpeaking
                        ? 'Tutor speaking (interrupt anytime)'
                        : 'Live — just speak!'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={toggleMicMute}
                      title={micMuted ? 'Unmute mic' : 'Mute mic'}
                      className={`p-1.5 rounded-lg border cursor-pointer transition ${
                        micMuted
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:text-white'
                      }`}
                    >
                      {micMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={stopLiveCall}
                      title="End Live Call"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition"
                    >
                      <PhoneOff className="w-3.5 h-3.5" /> End
                    </button>
                  </div>
                </div>
              )}
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
                      On Vercel, <code className="text-zinc-200">GEMINI_API_KEY</code> mints single-use ephemeral tokens via <code className="text-zinc-200">/api/live-token</code> so your key stays server-side.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Live Transcript Feed */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
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
                </motion.div>
              ))}

              {thinking && (
                <div className="flex items-center gap-2 text-xs text-zinc-400 px-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  Responding live...
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/35 text-xs text-rose-200">
                  {errorMsg}
                </div>
              )}
            </div>

            {/* Speaking Interrupt Bar (when typing without full mic call) */}
            {modelSpeaking && !micActive && (
              <div className="mx-4 mb-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <div className="flex items-end gap-0.5 h-3.5">
                    {[0, 1, 2, 3, 4].map((bar) => (
                      <motion.span
                        key={bar}
                        animate={{ height: ['25%', '100%', '35%'] }}
                        transition={{ repeat: Infinity, duration: 0.5, delay: bar * 0.08 }}
                        className="w-1 bg-emerald-400 rounded-full"
                      />
                    ))}
                  </div>
                  <span className="font-semibold">Speaking live ({voiceName})...</span>
                </div>
                <button
                  onClick={() => playerRef.current?.interrupt()}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-200 hover:text-white cursor-pointer"
                >
                  <Square className="w-3 h-3" /> Stop
                </button>
              </div>
            )}

            {/* Starter Prompts */}
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendTextMessage(p)}
                  disabled={connecting}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 text-[11px] text-zinc-300 hover:text-white cursor-pointer transition"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Text Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendTextMessage(input)
              }}
              className="p-3.5 border-t border-zinc-800/90 bg-zinc-900/75 flex items-center gap-2"
            >
              <button
                type="button"
                onClick={micActive ? stopLiveCall : startLiveCall}
                disabled={connecting}
                title={micActive ? 'End live voice' : 'Start live voice'}
                className={`p-2.5 rounded-xl border cursor-pointer transition shrink-0 ${
                  micActive
                    ? 'bg-rose-600 border-rose-500 text-white'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-emerald-500/60 hover:text-emerald-300'
                }`}
              >
                {micActive ? <PhoneOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a question or tap Start Live Voice..."
                className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white"
              />

              <button
                type="submit"
                disabled={connecting || !input.trim()}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white cursor-pointer transition shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
