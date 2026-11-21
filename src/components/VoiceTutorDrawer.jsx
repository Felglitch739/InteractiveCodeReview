import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Volume2, VolumeX, Send, X, KeyRound, MessageSquare,
  Loader2, Square, Trash2, GraduationCap, Radio
} from 'lucide-react'
import { getCleanCodeString } from '../data/projectData'

const MODEL_CHAIN = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.5-flash']

const STARTER_PROMPTS = [
  'Explain split() and [6:] simply',
  'Why does position start at -1?',
  'Quiz me like our CSCI 1380 professor',
  'Void vs value-returning functions in our code',
]

const CLIENT_SYSTEM_PROMPT = `You are a friendly, concise CSCI 1380 Python study tutor helping Jeremy Hernández, Sara Astorga, and Felix Martinez understand and present their Final Project Prompt #8 ("Student Club Member Directory").
- Keep answers short (2 to 5 sentences), clear, and natural so they sound great when spoken aloud.
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
  text: 'Ready to study! Tap the mic to ask any question out loud about your **Student Club Member Directory** code, or click **Mock Professor** to practice answering presentation questions.',
}

export default function VoiceTutorDrawer({ open, onClose, queuedQuestion, onClearQueued }) {
  const [messages, setMessages] = useState([WELCOME_MSG])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [voiceLang, setVoiceLang] = useState('en-US')
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [speakingId, setSpeakingId] = useState(null)
  const [showKeyBox, setShowKeyBox] = useState(false)
  const [localKey, setLocalKey] = useState(() => sessionStorage.getItem('gemini_tutor_key') || '')
  const [errorMsg, setErrorMsg] = useState('')

  const recognitionRef = useRef(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  const speechSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading, interimText])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 220)
    } else {
      recognitionRef.current?.stop()
      setListening(false)
      setInterimText('')
    }
  }, [open])

  useEffect(() => {
    if (open && queuedQuestion) {
      sendMessage(queuedQuestion)
      onClearQueued?.()
    }
  }, [open, queuedQuestion])

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setSpeakingId(null)
  }

  const pickBestVoice = (lang) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
    const voices = window.speechSynthesis.getVoices()
    const prefix = lang.slice(0, 2).toLowerCase()
    const matching = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix))
    return (
      matching.find((v) => /natural|google|aria|guy|jenny|samantha/i.test(v.name)) ||
      matching[0] ||
      null
    )
  }

  const speakText = (text, msgId, force = false) => {
    if ((!autoSpeak && !force) || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return
    }
    window.speechSynthesis.cancel()
    const clean = text.replace(/[`*_#]/g, '').replace(/\n+/g, '. ')
    const utter = new SpeechSynthesisUtterance(clean)
    utter.lang = voiceLang
    const preferred = pickBestVoice(voiceLang)
    if (preferred) utter.voice = preferred
    utter.rate = 1.03
    utter.onstart = () => setSpeakingId(msgId)
    utter.onend = () => setSpeakingId(null)
    utter.onerror = () => setSpeakingId(null)
    window.speechSynthesis.speak(utter)
  }

  const toggleMic = () => {
    if (!speechSupported) {
      setErrorMsg('Voice input requires Chrome, Edge, or Safari. You can still type below.')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      setInterimText('')
      return
    }
    stopSpeaking()
    setErrorMsg('')
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SpeechRec()
    rec.lang = voiceLang
    rec.interimResults = true
    rec.maxAlternatives = 1

    let finalTranscript = ''
    rec.onstart = () => {
      setListening(true)
      setInterimText('')
    }
    rec.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript
        if (event.results[i].isFinal) finalTranscript += piece
        else interim += piece
      }
      setInterimText((finalTranscript + interim).trim())
    }
    rec.onerror = (e) => {
      setListening(false)
      setInterimText('')
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setErrorMsg(`Microphone error: ${e.error}`)
      }
    }
    rec.onend = () => {
      setListening(false)
      const spoken = finalTranscript.trim()
      setInterimText('')
      if (spoken) sendMessage(spoken)
    }

    recognitionRef.current = rec
    rec.start()
  }

  const callGeminiDirect = async (apiKey, userMsg, history) => {
    const contents = [
      ...history.slice(-10).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }],
      })),
      { role: 'user', parts: [{ text: userMsg }] },
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
            generationConfig: { temperature: 0.4, maxOutputTokens: 360 },
          }),
        }
      )
      const data = await res.json()
      if (res.ok) {
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.'
      }
      lastErr = data?.error?.message || `HTTP ${res.status}`
    }
    throw new Error(lastErr)
  }

  const sendMessage = async (textToSend) => {
    const trimmed = textToSend.trim()
    if (!trimmed || loading) return

    stopSpeaking()
    setErrorMsg('')
    const nextUser = { id: Date.now(), role: 'user', text: trimmed }
    const historySnapshot = [...messages]
    setMessages((prev) => [...prev, nextUser])
    setInput('')
    setLoading(true)

    try {
      let reply = ''
      const envKey = import.meta.env.VITE_GEMINI_API_KEY
      const activeKey = localKey.trim() || envKey

      if (!activeKey) {
        const res = await fetch('/api/tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, history: historySnapshot }),
        })
        if (res.ok) {
          const data = await res.json()
          reply = data.reply
        } else {
          setShowKeyBox(true)
          throw new Error(
            'Set GEMINI_API_KEY in Vercel Environment Variables, or paste a local key via the key icon.'
          )
        }
      } else {
        reply = await callGeminiDirect(activeKey, trimmed, historySnapshot)
      }

      const replyId = Date.now() + 1
      setMessages((prev) => [...prev, { id: replyId, role: 'assistant', text: reply }])
      speakText(reply, replyId)
    } catch (err) {
      setErrorMsg(err.message || 'Could not reach Gemini.')
    } finally {
      setLoading(false)
    }
  }

  const saveLocalKey = (val) => {
    setLocalKey(val)
    if (val.trim()) sessionStorage.setItem('gemini_tutor_key', val.trim())
    else sessionStorage.removeItem('gemini_tutor_key')
  }

  const clearChat = () => {
    stopSpeaking()
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
              stopSpeaking()
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
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Ready
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono">Gemini Flash · Voice &amp; Chat</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setVoiceLang((l) => (l === 'en-US' ? 'es-MX' : 'en-US'))}
                  title="Switch voice language (English / Spanish)"
                  className="px-2 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-zinc-700 font-mono text-[11px] font-bold text-zinc-300 cursor-pointer transition"
                >
                  {voiceLang === 'en-US' ? 'EN' : 'ES'}
                </button>

                <button
                  onClick={() => {
                    if (autoSpeak) stopSpeaking()
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
                    stopSpeaking()
                    onClose()
                  }}
                  title="Close (Esc)"
                  className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mock Professor Action Bar */}
            <div className="px-4 py-2.5 border-b border-zinc-800/70 bg-zinc-950/60 flex items-center justify-between gap-2">
              <span className="text-[11px] text-zinc-400">
                Practice answering out loud before Monday
              </span>
              <button
                onClick={() =>
                  sendMessage(
                    'Act like our CSCI 1380 professor during our final presentation. Ask me ONE short question about our Student Club Member Directory code and wait for my answer.'
                  )
                }
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/15 border border-amber-500/35 text-amber-300 hover:bg-amber-500/25 cursor-pointer transition shrink-0"
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
                      In Vercel, set <code className="text-zinc-200">GEMINI_API_KEY</code> under Environment Variables so <code className="text-zinc-200">/api/tutor</code> handles requests securely server-side.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {messages.map((m) => {
                const isSpeakingThis = speakingId === m.id
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
                          isSpeakingThis ? stopSpeaking() : speakText(m.text, m.id, true)
                        }
                        className="mt-1 ml-1 inline-flex items-center gap-1 text-[10.5px] font-medium text-zinc-500 hover:text-emerald-300 cursor-pointer transition"
                      >
                        {isSpeakingThis ? (
                          <>
                            <Square className="w-2.5 h-2.5 fill-current" /> Stop audio
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" /> Read aloud
                          </>
                        )}
                      </button>
                    )}
                  </motion.div>
                )
              })}

              {interimText && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl px-3.5 py-2 text-xs italic bg-emerald-500/15 border border-emerald-500/30 text-emerald-200">
                    "{interimText}..."
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-zinc-400 px-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  Generating explanation...
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
                  onClick={() => sendMessage(p)}
                  disabled={loading}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 text-[11px] text-zinc-300 hover:text-white cursor-pointer transition"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Live Voice Waveform Bar */}
            {(listening || speakingId !== null) && (
              <div className="mx-4 mb-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center gap-2.5">
                  <Radio className={`w-3.5 h-3.5 ${listening ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
                  <div className="flex items-end gap-0.5 h-3.5">
                    {[0, 1, 2, 3, 4].map((bar) => (
                      <motion.span
                        key={bar}
                        animate={{ height: ['25%', '100%', '35%'] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.6,
                          delay: bar * 0.1,
                        }}
                        className={`w-1 rounded-full ${listening ? 'bg-rose-400' : 'bg-emerald-400'}`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">
                    {listening
                      ? `Listening (${voiceLang === 'en-US' ? 'English' : 'Español'})...`
                      : 'Speaking reply...'}
                  </span>
                </div>
                {speakingId !== null && (
                  <button
                    onClick={stopSpeaking}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-200 hover:text-white cursor-pointer"
                  >
                    <Square className="w-3 h-3" /> Stop
                  </button>
                )}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendMessage(input)
              }}
              className="p-3.5 border-t border-zinc-800/90 bg-zinc-900/75 flex items-center gap-2"
            >
              <button
                type="button"
                onClick={toggleMic}
                title={listening ? 'Stop listening' : 'Tap to speak'}
                className={`p-2.5 rounded-xl border cursor-pointer transition shrink-0 ${
                  listening
                    ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/30'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-300'
                }`}
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask by voice or type here..."
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
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
