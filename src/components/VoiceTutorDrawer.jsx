import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, AudioLines, Volume2, VolumeX, Send, X, KeyRound, Loader2, Square, Trash2, Check
} from 'lucide-react'
import { GeminiLiveClient, PcmStreamPlayer } from '../utils/liveAudioEngine'
import { blobToBase64, pickSupportedAudioMime } from '../utils/audioUtils'

const TRANSCRIBE_MODELS = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.5-flash']

const VOICES = [
  { id: 'Kore', label: 'Kore' },
  { id: 'Puck', label: 'Puck' },
  { id: 'Zephyr', label: 'Zephyr' },
  { id: 'Fenrir', label: 'Fenrir' },
]

const EXAM_STARTER_PROMPTS = [
  'Explain input() vs int() simply',
  'Difference between r, w, and a file modes',
  'Explain print vs return and local scope',
]

const PROJECT_STARTER_PROMPTS = [
  'Explain split() and [6:] simply',
  'Why does position start at -1?',
  'Difference between void and return functions',
]

const EXAM_SYSTEM_INSTRUCTION = `You are a calm, concise CSCI 1380 (Intro to Python) study tutor helping students review Weeks 1-12 for their final exam.
- Cover only Intro to Python basics: running .py files, variables, input()/int()/float(), files (r/w/a), booleans, if/elif/else, nested conditionals, logical operators (and/or/not), for/while loops, break/continue, built-in & custom functions, print vs return, parameters & local scope, lists, tuples, sets, dictionaries, and modular program design.
- Keep answers natural, clear, and concise (2 to 4 sentences).
- Reply in English by default, or Spanish if the student speaks or writes in Spanish.
- Never mention any specific student's final project code; keep examples general and beginner-friendly (no try/except, lambdas, classes, or list comprehensions).`

async function getSystemInstruction(scope) {
  if (scope !== 'project') return EXAM_SYSTEM_INSTRUCTION
  const { getProjectSystemInstruction } = await import('../data/projectData')
  return getProjectSystemInstruction()
}

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

function makeWelcomeMsg(scope) {
  return {
    id: 1,
    role: 'assistant',
    text:
      scope === 'project'
        ? 'Ask anything about your Student Club Member Directory code. Use the mic to record a voice note, the waveform icon for hands-free live mode, or type below.'
        : 'Ask anything about CSCI 1380 (Weeks 1–12 Intro to Python). Tap the mic to record a voice note, the waveform icon for hands-free mode, or type below.',
  }
}

const LIVE_USES_KEY = 'csci1380_live_daily_uses_v1'
const MAX_DAILY_LIVE_USES = 5

function getTodayStamp() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function readDailyLiveUses() {
  if (typeof window === 'undefined') return 0
  try {
    const raw = JSON.parse(localStorage.getItem(LIVE_USES_KEY) || '{}')
    return raw.date === getTodayStamp() ? Number(raw.count) || 0 : 0
  } catch {
    return 0
  }
}

function writeDailyLiveUses(count) {
  try {
    localStorage.setItem(LIVE_USES_KEY, JSON.stringify({ date: getTodayStamp(), count }))
  } catch {
    // ignore
  }
}

export default function VoiceTutorDrawer({ open, onClose, queuedQuestion, onClearQueued, scope = 'exam' }) {
  const starterPrompts = scope === 'project' ? PROJECT_STARTER_PROMPTS : EXAM_STARTER_PROMPTS
  const showDevKeyButton = import.meta.env.DEV || scope === 'project'
  const [messages, setMessages] = useState(() => [makeWelcomeMsg(scope)])
  const [liveUsesToday, setLiveUsesToday] = useState(readDailyLiveUses)
  const liveUsesLeft = Math.max(0, MAX_DAILY_LIVE_USES - liveUsesToday)
  const [input, setInput] = useState('')
  const [voiceName, setVoiceName] = useState('Kore')
  const [speakerMuted, setSpeakerMuted] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [liveConnected, setLiveConnected] = useState(false)

  // Manual voice-note recording (Mic button)
  const [recording, setRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)

  // Hands-free live mode (AudioLines button)
  const [handsFree, setHandsFree] = useState(false)
  const [handsFreeHearing, setHandsFreeHearing] = useState(false)

  const [modelSpeaking, setModelSpeaking] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [meterLevels, setMeterLevels] = useState([18, 22, 26, 22, 18, 22, 18])
  const [showKeyBox, setShowKeyBox] = useState(false)
  const [localKey, setLocalKey] = useState(() => sessionStorage.getItem('gemini_tutor_key') || '')
  const [errorMsg, setErrorMsg] = useState('')

  const liveClientRef = useRef(null)
  const playerRef = useRef(null)
  const activeModelMsgIdRef = useRef(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  // Refs for manual recording
  const mediaRecorderRef = useRef(null)
  const audioStreamRef = useRef(null)
  const chunksRef = useRef([])
  const cancelRecRef = useRef(false)
  const meterCtxRef = useRef(null)
  const rafRef = useRef(null)
  const timerRef = useRef(null)

  // Refs for hands-free live mode
  const hfActiveRef = useRef(false)
  const hfStreamRef = useRef(null)
  const hfCtxRef = useRef(null)
  const hfRafRef = useRef(null)
  const hfRecorderRef = useRef(null)
  const hfChunksRef = useRef([])
  const hfBusyRef = useRef(false) // true while transcribing or tutor speaking
  const modelSpeakingRef = useRef(false)
  const thinkingRef = useRef(false)

  const idleTimerRef = useRef(null)

  const bumpIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    // Auto-close idle Live WebSocket after 90s of inactivity to protect Gemini API quota
    idleTimerRef.current = setTimeout(() => {
      if (!hfActiveRef.current && !modelSpeakingRef.current) {
        liveClientRef.current?.close()
        liveClientRef.current = null
        setLiveConnected(false)
      }
    }, 90000)
  }

  useEffect(() => {
    setMessages([makeWelcomeMsg(scope)])
    disconnectAll()
  }, [scope])

  useEffect(() => {
    modelSpeakingRef.current = modelSpeaking
  }, [modelSpeaking])

  useEffect(() => {
    thinkingRef.current = thinking
  }, [thinking])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, thinking, recording, handsFree])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200)
    } else {
      stopHandsFree()
      cleanupRecording(true)
      disconnectAll()
    }
  }, [open])

  useEffect(
    () => () => {
      stopHandsFree()
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

  const stopHandsFree = () => {
    hfActiveRef.current = false
    hfBusyRef.current = false
    if (hfRafRef.current) {
      cancelAnimationFrame(hfRafRef.current)
      hfRafRef.current = null
    }
    if (hfRecorderRef.current && hfRecorderRef.current.state !== 'inactive') {
      try {
        hfRecorderRef.current.onstop = null
        hfRecorderRef.current.stop()
      } catch {
        // ignore
      }
    }
    hfRecorderRef.current = null
    hfChunksRef.current = []
    if (hfCtxRef.current) {
      hfCtxRef.current.close().catch(() => {})
      hfCtxRef.current = null
    }
    if (hfStreamRef.current) {
      hfStreamRef.current.getTracks().forEach((t) => t.stop())
      hfStreamRef.current = null
    }
    setHandsFree(false)
    setHandsFreeHearing(false)
    setMeterLevels([18, 22, 26, 22, 18, 22, 18])
  }

  const disconnectAll = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
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

    const instruction = await getSystemInstruction(scope)
    const client = new GeminiLiveClient({
      voiceName: chosenVoice,
      systemInstruction: instruction,
      directApiKey: getDirectKey(),
      onReady: () => {
        setLiveConnected(true)
        setConnecting(false)
        bumpIdleTimer()
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
        bumpIdleTimer()
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
      if (showDevKeyButton && !getDirectKey()) setShowKeyBox(true)
      setErrorMsg(err.message || 'Could not connect to voice service.')
      throw err
    }
  }

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
                    text: 'Transcribe exactly what the speaker said (in English or Spanish). Return ONLY the spoken words with normal punctuation and nothing else. If silent, noise, or unintelligible, return an empty string.',
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

  const handleRecordedVoice = async (blob, mimeType, silentIfEmpty = false) => {
    setErrorMsg('')
    playerRef.current?.interrupt()
    activeModelMsgIdRef.current = null

    const placeholderId = Date.now() + Math.random()
    setMessages((prev) => [
      ...prev,
      { id: placeholderId, role: 'user', text: 'Transcribing...' },
    ])
    setThinking(true)

    try {
      const [transcript, client] = await Promise.all([
        transcribeAudioBlob(blob, mimeType),
        ensureLiveSession(),
      ])

      if (!transcript) {
        setMessages((prev) => prev.filter((m) => m.id !== placeholderId))
        setThinking(false)
        if (!silentIfEmpty) {
          setErrorMsg('No speech detected—speak clearly and try again.')
        }
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

  // ---- Mode 1: Push-to-Record & Send (Mic icon — kept exactly as Felix liked!) ----
  const startRecording = async () => {
    if (connecting || thinking) return
    stopHandsFree()
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
            handleRecordedVoice(blob, finalMime, false)
          } else {
            setErrorMsg('Recording was too short—speak your question and tap Send.')
          }
        }
      }

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
        // optional meter
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

  // ---- Mode 2: Hands-Free Live Mode (AudioLines icon — auto-listens & auto-sends on pause!) ----
  const startHandsFree = async () => {
    if (handsFree) {
      stopHandsFree()
      return
    }
    if (scope === 'exam') {
      const used = readDailyLiveUses()
      if (used >= MAX_DAILY_LIVE_USES) {
        setLiveUsesToday(used)
        setErrorMsg(
          `Daily Live Voice limit reached (${MAX_DAILY_LIVE_USES}/${MAX_DAILY_LIVE_USES}). Resets tomorrow—you can still type questions or use all labs offline!`
        )
        return
      }
      const nextCount = used + 1
      writeDailyLiveUses(nextCount)
      setLiveUsesToday(nextCount)
    }
    cleanupRecording(true)
    setErrorMsg('')
    ensurePlayer()

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setErrorMsg('Live voice mode requires HTTPS and a modern browser.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      hfStreamRef.current = stream
      hfActiveRef.current = true
      hfBusyRef.current = false
      setHandsFree(true)
      setHandsFreeHearing(false)

      // Pre-connect Gemini 3.8 Live immediately so replies start with zero extra handshake wait
      ensureLiveSession().catch(() => {})

      const AudioCtx = window.AudioContext || window.webkitAudioContext
      const ctx = new AudioCtx()
      if (ctx.state === 'suspended') await ctx.resume()
      hfCtxRef.current = ctx

      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      src.connect(analyser)

      const timeData = new Float32Array(analyser.fftSize)
      const freqData = new Uint8Array(analyser.frequencyBinCount)
      const mime = pickSupportedAudioMime()

      let noiseFloor = 0.012
      let isCapturing = false
      let speechStartAt = 0
      let lastVoicedAt = 0
      const startedAt = performance.now()

      const beginClip = () => {
        if (!hfActiveRef.current || isCapturing) return
        try {
          hfChunksRef.current = []
          const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
          hfRecorderRef.current = rec
          rec.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) hfChunksRef.current.push(e.data)
          }
          rec.onstop = async () => {
            if (!hfActiveRef.current) return
            const chunks = hfChunksRef.current
            hfChunksRef.current = []
            const clipDuration = performance.now() - speechStartAt
            if (chunks.length === 0 || clipDuration < 420) return

            const finalMime = rec.mimeType || mime || 'audio/webm'
            const blob = new Blob(chunks, { type: finalMime })
            if (blob.size < 1000) return

            hfBusyRef.current = true
            try {
              await handleRecordedVoice(blob, finalMime, true)
            } finally {
              hfBusyRef.current = false
            }
          }
          rec.start()
          isCapturing = true
          speechStartAt = performance.now()
          setHandsFreeHearing(true)
        } catch {
          isCapturing = false
        }
      }

      const finishClip = () => {
        if (!isCapturing) return
        isCapturing = false
        setHandsFreeHearing(false)
        const rec = hfRecorderRef.current
        hfRecorderRef.current = null
        if (rec && rec.state !== 'inactive') {
          try {
            rec.stop()
          } catch {
            // ignore
          }
        }
      }

      const loop = () => {
        if (!hfActiveRef.current) return

        // Pause listening while tutor is thinking or speaking so laptop speakers never echo back
        if (hfBusyRef.current || thinkingRef.current || modelSpeakingRef.current) {
          if (isCapturing) {
            // Discard accidental capture during playback
            const rec = hfRecorderRef.current
            if (rec) rec.onstop = null
            finishClip()
          }
          setMeterLevels([18, 22, 26, 22, 18, 22, 18])
          hfRafRef.current = requestAnimationFrame(loop)
          return
        }

        analyser.getFloatTimeDomainData(timeData)
        analyser.getByteFrequencyData(freqData)

        let sqSum = 0
        for (let i = 0; i < timeData.length; i++) sqSum += timeData[i] * timeData[i]
        const rms = Math.sqrt(sqSum / timeData.length)

        const bars = [2, 5, 9, 14, 20, 28, 38].map((idx) =>
          Math.max(16, Math.min(100, Math.round((freqData[idx] / 255) * 100)))
        )
        setMeterLevels(bars)

        const now = performance.now()
        // Calibrate room noise floor for the first 400ms before triggering
        if (now - startedAt < 400) {
          noiseFloor = noiseFloor * 0.85 + rms * 0.15
          hfRafRef.current = requestAnimationFrame(loop)
          return
        }

        const threshold = Math.max(0.015, noiseFloor * 2.15)

        if (rms > threshold) {
          lastVoicedAt = now
          if (!isCapturing) {
            beginClip()
          }
        } else if (!isCapturing) {
          noiseFloor = Math.max(0.004, Math.min(0.03, noiseFloor * 0.96 + rms * 0.04))
        }

        // Auto-send ~900ms after user stops speaking (hands-free!)
        if (isCapturing && now - lastVoicedAt > 900) {
          finishClip()
        }

        // Max 18s single utterance safeguard
        if (isCapturing && now - speechStartAt > 18000) {
          finishClip()
        }

        hfRafRef.current = requestAnimationFrame(loop)
      }

      loop()
    } catch (err) {
      stopHandsFree()
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setErrorMsg('Microphone permission is blocked. Allow microphone access in your browser address bar.')
      } else {
        setErrorMsg(err?.message || 'Could not start live mode.')
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
    if (liveConnected) {
      liveClientRef.current?.close()
      liveClientRef.current = null
      setLiveConnected(false)
      if (handsFree) ensureLiveSession(nextVoice).catch(() => {})
    }
  }

  const saveLocalKey = (val) => {
    setLocalKey(val)
    if (val.trim()) sessionStorage.setItem('gemini_tutor_key', val.trim())
    else sessionStorage.removeItem('gemini_tutor_key')
  }

  const clearChat = () => {
    stopHandsFree()
    cleanupRecording(true)
    disconnectAll()
    setErrorMsg('')
    setMessages([makeWelcomeMsg(scope)])
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
              stopHandsFree()
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
                  {handsFree
                    ? 'Hands-free live'
                    : connecting
                    ? 'Connecting...'
                    : scope === 'exam'
                    ? `Live left today: ${liveUsesLeft}/${MAX_DAILY_LIVE_USES}`
                    : liveConnected
                    ? 'Connected · Live Voice'
                    : 'Ready'}
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

                {showDevKeyButton && (
                  <button
                    onClick={() => setShowKeyBox((v) => !v)}
                    title="Local API key"
                    className="neu-btn p-2 rounded-lg text-ink-2 hover:text-ink cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => {
                    stopHandsFree()
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
              {showDevKeyButton && showKeyBox && (
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

            {/* Speaking Strip (when not in hands-free bar) */}
            {modelSpeaking && !recording && !handsFree && (
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
              {starterPrompts.map((p) => (
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

            {/* Bottom Controls: Hands-Free Live Bar OR Manual Recording Bar OR Default Input Bar */}
            {handsFree ? (
              <div className="p-4 border-t neu-divider flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex items-end gap-0.5 h-5 shrink-0">
                    {meterLevels.map((lvl, idx) => (
                      <span
                        key={idx}
                        style={{
                          height: `${modelSpeaking ? [35, 70, 50, 85, 60, 75, 40][idx] : lvl}%`,
                          backgroundColor: handsFreeHearing ? '#10b981' : 'var(--text-primary)',
                        }}
                        className="w-[3px] rounded-full transition-all duration-75"
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-ink truncate">
                    {handsFreeHearing
                      ? 'Hearing you...'
                      : thinking
                      ? 'Thinking...'
                      : modelSpeaking
                      ? `Speaking (${voiceName})`
                      : 'Live — just speak'}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {modelSpeaking && (
                    <button
                      type="button"
                      onClick={() => playerRef.current?.interrupt()}
                      className="neu-btn px-2.5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Interrupt
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={stopHandsFree}
                    className="neu-btn-primary px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    End live
                  </button>
                </div>
              </div>
            ) : recording ? (
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
                className="p-4 border-t neu-divider flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={connecting || thinking}
                  title="Record voice note (tap Send when done)"
                  className="neu-btn p-2.5 rounded-xl disabled:opacity-40 cursor-pointer shrink-0"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={startHandsFree}
                  disabled={connecting || thinking || (scope === 'exam' && liveUsesLeft === 0)}
                  title={
                    scope === 'exam'
                      ? liveUsesLeft > 0
                        ? `Hands-free live mode (${liveUsesLeft}/${MAX_DAILY_LIVE_USES} left today)`
                        : 'Daily live limit reached (5/5) — resets tomorrow'
                      : 'Hands-free live conversation'
                  }
                  className="neu-btn p-2.5 rounded-xl disabled:opacity-40 cursor-pointer shrink-0"
                >
                  <AudioLines className="w-4 h-4" />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="neu-inset flex-1 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:outline-none min-w-0"
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
