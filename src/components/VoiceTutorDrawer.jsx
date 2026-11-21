import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Volume2, VolumeX, Send, X, KeyRound, Loader2, Square, Trash2
} from 'lucide-react'
import { getCleanCodeString } from '../data/projectData'
import { GeminiLiveClient, MicPcmStreamer, PcmStreamPlayer } from '../utils/liveAudioEngine'

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
                isUser
                  ? 'bg-white/15 text-white'
                  : 'bg-[#dfe4ec] text-[#161922]'
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
  text: 'Ask anything about your Student Club Member Directory code. Tap the microphone below to speak live, or type a question.',
}

export default function VoiceTutorDrawer({ open, onClose, queuedQuestion, onClearQueued }) {
  const [messages, setMessages] = useState([WELCOME_MSG])
  const [input, setInput] = useState('')
  const [voiceName, setVoiceName] = useState('Kore')
  const [speakerMuted, setSpeakerMuted] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [liveConnected, setLiveConnected] = useState(false)
  const [micActive, setMicActive] = useState(false)
  const [userSpeaking, setUserSpeaking] = useState(false)
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
      setTimeout(() => inputRef.current?.focus(), 200)
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
    setUserSpeaking(false)

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
        if (!chunk) return
        activeModelMsgIdRef.current = null
        if (!activeUserMsgIdRef.current) {
          const newId = Date.now() + Math.random()
          activeUserMsgIdRef.current = newId
          setMessages((prev) =>
            prev.some((m) => m.id === newId)
              ? prev
              : [...prev, { id: newId, role: 'user', text: chunk.trimStart() }]
          )
        } else {
          const targetId = activeUserMsgIdRef.current
          setMessages((prev) =>
            prev.map((m) => (m.id === targetId ? { ...m, text: m.text + chunk } : m))
          )
        }
      },
      onModelTranscript: (chunk) => {
        if (!chunk) return
        setThinking(false)
        activeUserMsgIdRef.current = null
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
      setErrorMsg(err.message || 'Could not connect to voice service.')
      throw err
    }
  }

  const createMicStreamer = () =>
    new MicPcmStreamer({
      onChunk: (b64) => {
        if (liveClientRef.current?.ready) {
          liveClientRef.current.sendPcmAudio(b64)
        }
      },
      onSpeechEnd: () => {
        if (liveClientRef.current?.ready) {
          setThinking(true)
          setTimeout(() => {
            setThinking((t) => (t ? false : t))
          }, 4500)
        }
      },
      onUserSpeakingChange: (speaking) => {
        setUserSpeaking(speaking)
      },
      onLevels: (bars) => setMeterLevels(bars),
    })

  const toggleMic = async () => {
    if (micActive) {
      // Stopping the mic cleanly lets Gemini finish replying if user just spoke
      micRef.current?.stop()
      micRef.current = null
      setMicActive(false)
      setUserSpeaking(false)
      return
    }

    setErrorMsg('')
    try {
      ensurePlayer()
      const mic = createMicStreamer()
      await mic.start()
      micRef.current = mic
      setMicActive(true)
      await ensureLiveSession()
    } catch (err) {
      micRef.current?.stop()
      micRef.current = null
      setMicActive(false)
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
      disconnectAll()
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
            className="fixed inset-0 bg-[#161922]/25 backdrop-blur-xs z-50"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-[420px] bg-[#e8ecf2] border-l border-white/80 z-50 flex flex-col shadow-2xl"
          >
            {/* Minimal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#d7dde7]">
              <div>
                <h3 className="text-sm font-semibold text-[#161922]">Voice Tutor</h3>
                <p className="text-[11px] text-[#647084]">
                  {connecting ? 'Connecting...' : liveConnected ? 'Connected · Live' : 'Ready'}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <select
                  value={voiceName}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                  aria-label="Tutor voice"
                  className="neu-btn rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-[#161922] focus:outline-none cursor-pointer"
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
                  className="neu-btn p-2 rounded-lg text-[#475569] hover:text-[#161922] cursor-pointer"
                >
                  {speakerMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={clearChat}
                  title="Clear chat"
                  className="neu-btn p-2 rounded-lg text-[#475569] hover:text-[#161922] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setShowKeyBox((v) => !v)}
                  title="Local API key"
                  className="neu-btn p-2 rounded-lg text-[#475569] hover:text-[#161922] cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    disconnectAll()
                    onClose()
                  }}
                  title="Close"
                  className="neu-btn p-2 rounded-lg text-[#475569] hover:text-[#161922] cursor-pointer"
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
                  className="overflow-hidden border-b border-[#d7dde7]"
                >
                  <div className="p-4 space-y-2">
                    <div className="text-[11px] font-medium text-[#475569]">
                      Local API Key Override (session only)
                    </div>
                    <input
                      type="password"
                      value={localKey}
                      onChange={(e) => saveLocalKey(e.target.value)}
                      placeholder="Paste Gemini API key..."
                      className="neu-inset w-full rounded-xl px-3 py-2 font-mono text-xs text-[#161922] focus:outline-none"
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
                        ? 'bg-[#181b22] text-white rounded-br-sm shadow-md'
                        : 'neu-card-sm text-[#1e2430] rounded-bl-sm'
                    }`}
                  >
                    <FormattedText text={m.text} isUser={m.role === 'user'} />
                  </div>
                </motion.div>
              ))}

              {thinking && (
                <div className="flex items-center gap-2 text-xs text-[#647084] px-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-[#fbe9ec] border border-[#f2c6ce] text-xs text-[#9f1239]">
                  {errorMsg}
                </div>
              )}
            </div>

            {/* Active Voice / Speaking Strip */}
            {(micActive || modelSpeaking) && (
              <div className="mx-5 mb-2.5 px-3.5 py-2 rounded-xl neu-inset flex items-center justify-between text-xs text-[#161922]">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-end gap-0.5 h-4">
                    {(micActive ? meterLevels : [35, 70, 50, 85, 45]).map((lvl, idx) => (
                      <span
                        key={idx}
                        style={{ height: `${lvl}%` }}
                        className="w-[3px] bg-[#181b22] rounded-full transition-all duration-75"
                      />
                    ))}
                  </div>
                  <span className="font-medium text-[12px]">
                    {userSpeaking
                      ? 'Listening...'
                      : modelSpeaking
                      ? `Speaking (${voiceName})`
                      : 'Mic active — speak now'}
                  </span>
                </div>

                {modelSpeaking && (
                  <button
                    onClick={() => playerRef.current?.interrupt()}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#647084] hover:text-[#161922] cursor-pointer"
                  >
                    <Square className="w-2.5 h-2.5 fill-current" /> Stop
                  </button>
                )}
              </div>
            )}

            {/* Minimal Starter Suggestions */}
            <div className="px-5 pb-2.5 flex flex-wrap gap-1.5">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendTextMessage(p)}
                  disabled={connecting}
                  className="neu-btn px-2.5 py-1 rounded-lg text-[11px] text-[#475569] hover:text-[#161922] disabled:opacity-40 cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Clean Bottom Input + Mic Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendTextMessage(input)
              }}
              className="p-4 border-t border-[#d7dde7] flex items-center gap-2.5"
            >
              <button
                type="button"
                onClick={toggleMic}
                disabled={connecting}
                title={micActive ? 'Stop microphone' : 'Speak live'}
                className={`p-2.5 rounded-xl cursor-pointer transition shrink-0 ${
                  micActive
                    ? 'bg-[#be123c] text-white shadow-md'
                    : 'neu-btn text-[#161922]'
                }`}
              >
                {micActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="neu-inset flex-1 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#161922] placeholder:text-[#8793a6] focus:outline-none"
              />

              <button
                type="submit"
                disabled={connecting || !input.trim()}
                className="neu-btn-dark p-2.5 rounded-xl disabled:opacity-35 cursor-pointer shrink-0"
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
