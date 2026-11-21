import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, SkipBack, SkipForward, RotateCcw,
  Check, X, Volume2, VolumeX, Loader2, Square
} from 'lucide-react'
import { INITIAL_MEMBERS } from '../data/projectData'
import { getGeminiTtsUrl, prefetchGeminiTts } from '../utils/ttsClient'

const STEPS = [
  { id: 0, label: '1. readlines()', code: 'for line in saved_lines:' },
  { id: 1, label: '2. replace()', code: 'line = line.replace("\\n", "")' },
  { id: 2, label: '3. split()', code: 'parts = line.split(" | Role: ")' },
  { id: 3, label: '4. [0:6] & [6:]', code: 'parts[0][0:6]  &  parts[0][6:]' },
  { id: 4, label: '5. if check', code: 'if len(parts) == 2 and ...' },
  { id: 5, label: '6. append()', code: 'member_list.append(...) & member_roles.append(...)' },
]

function getStepNarration(step, info) {
  const { leftPart, rightPart, hasTwoParts, extractedName, allValid } = info
  switch (step) {
    case 0:
      return `Step 1, readlines. When Python reads a line from directory dot text, it brings an invisible newline character, backslash n, at the end. If we do not remove it, the role comparison later would fail.`
    case 1:
      return `Step 2, replace. Calling line dot replace removes the backslash n newline character by swapping it with an empty string. Now our line is completely clean and ready to split.`
    case 2:
      return hasTwoParts
        ? `Step 3, split. Splitting on the bar Role separator cuts the line into two pieces in a list called parts. Parts zero has ${leftPart}, and parts one already has the clean role: ${rightPart}.`
        : `Step 3, split. Python looks for the exact bar Role separator, but it is missing from this line, so parts only has one item instead of two.`
    case 3:
      return `Step 4, string slicing. Every character in parts zero has an index starting at zero. Indices zero through five are the six characters of Name colon space. Writing six colon grabs everything from index six to the end, giving us ${extractedName || 'an empty string'}.`
    case 4:
      return allValid
        ? `Step 5, safety check. Python checks four conditions: two parts exist, the first six characters match Name colon space, and neither the name nor the role is empty. All four are true, so file valid stays true.`
        : `Step 5, safety check. At least one of the four format checks failed, so file valid becomes false and Python warns the user instead of loading a broken record.`
    case 5:
      return allValid
        ? `Step 6, append. Python appends ${extractedName} to member list and ${rightPart} to member roles. Because both are appended together, they stay aligned at the exact same index.`
        : `Step 6, append is skipped because file valid is false. Broken lines are never added to the lists.`
    default:
      return ''
  }
}

export default function FileParserLab() {
  const [lineText, setLineText] = useState('Name: Sara Astorga | Role: Vice President')
  const [customInput, setCustomInput] = useState('Name: Sara Astorga | Role: Vice President')
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [fast, setFast] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [ttsLoading, setTtsLoading] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [ttsError, setTtsError] = useState('')

  const audioRef = useRef(null)
  const advanceTimerRef = useRef(null)
  const activeTokenRef = useRef(0)

  const parts = lineText.split(' | Role: ')
  const hasTwoParts = parts.length === 2
  const leftPart = parts[0] || ''
  const rightPart = hasTwoParts ? parts[1] : ''
  const prefix = leftPart.slice(0, 6)
  const extractedName = leftPart.slice(6)
  const checkPrefix = prefix === 'Name: '
  const checkName = extractedName !== ''
  const checkRole = rightPart !== ''
  const allValid = hasTwoParts && checkPrefix && checkName && checkRole

  const parsedInfo = { leftPart, rightPart, hasTwoParts, extractedName, allValid }

  const stopNarration = () => {
    activeTokenRef.current += 1
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    setSpeaking(false)
    setTtsLoading(false)
  }

  useEffect(() => () => stopNarration(), [])

  const speakStep = async (targetStep, autoAdvanceAfter = false) => {
    stopNarration()
    const token = activeTokenRef.current
    setTtsError('')
    setTtsLoading(true)

    try {
      const script = getStepNarration(targetStep, parsedInfo)
      if (targetStep + 1 < STEPS.length) {
        prefetchGeminiTts(getStepNarration(targetStep + 1, parsedInfo), 'Kore')
      }
      const wavUrl = await getGeminiTtsUrl(script, 'Kore')
      if (token !== activeTokenRef.current) return

      setTtsLoading(false)
      const audio = new Audio(wavUrl)
      audioRef.current = audio
      setSpeaking(true)

      audio.onended = () => {
        if (token !== activeTokenRef.current) return
        setSpeaking(false)
        audioRef.current = null
        if (autoAdvanceAfter) {
          if (targetStep < STEPS.length - 1) {
            advanceTimerRef.current = setTimeout(() => {
              if (token !== activeTokenRef.current) return
              setStep(targetStep + 1)
            }, 500)
          } else {
            setPlaying(false)
          }
        }
      }

      audio.onerror = () => {
        if (token !== activeTokenRef.current) return
        setSpeaking(false)
        audioRef.current = null
        if (autoAdvanceAfter) setPlaying(false)
      }

      await audio.play()
    } catch {
      if (token !== activeTokenRef.current) return
      setTtsLoading(false)
      setSpeaking(false)
      setTtsError('Voice narration unavailable—switched to silent timer.')
      if (autoAdvanceAfter) {
        advanceTimerRef.current = setTimeout(() => {
          if (token !== activeTokenRef.current) return
          if (targetStep < STEPS.length - 1) setStep(targetStep + 1)
          else setPlaying(false)
        }, fast ? 1100 : 2100)
      }
    }
  }

  useEffect(() => {
    if (!playing) return

    if (voiceEnabled) {
      speakStep(step, true)
      return () => stopNarration()
    }

    const timer = setTimeout(() => {
      if (step < STEPS.length - 1) setStep((s) => s + 1)
      else setPlaying(false)
    }, fast ? 1050 : 2100)

    return () => clearTimeout(timer)
  }, [playing, step, voiceEnabled, fast, lineText])

  const goToStep = (nextStep) => {
    setPlaying(false)
    stopNarration()
    setStep(nextStep)
  }

  const selectPreset = (text, startStep = 0) => {
    setPlaying(false)
    stopNarration()
    setLineText(text)
    setCustomInput(text)
    setStep(startStep)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#161922]">
          File Loading Pipeline
        </h2>
        <p className="text-sm text-[#647084] mt-1 max-w-2xl">
          Step through how Python reads a line from <span className="font-mono text-[#161922]">directory.txt</span>, removes{' '}
          <span className="font-mono text-[#161922]">\n</span>, splits the name and role, slices <span className="font-mono text-[#161922]">[6:]</span>, and appends both values before the menu starts.
        </p>
      </div>

      {/* Line Selector */}
      <div className="neu-card rounded-2xl p-5 space-y-3.5">
        <div className="flex flex-wrap gap-2">
          {INITIAL_MEMBERS.map((m, idx) => {
            const full = `Name: ${m.name} | Role: ${m.role}`
            const active = lineText === full
            return (
              <button
                key={m.id}
                onClick={() => selectPreset(full, 0)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition ${
                  active ? 'neu-inset text-[#161922] font-semibold' : 'neu-btn text-[#526075]'
                }`}
              >
                {idx + 1}. {m.name.split(' ')[0]} · {m.role}
              </button>
            )
          })}
          <button
            onClick={() => selectPreset('Sara Astorga - Vice President', 2)}
            className="neu-btn px-3 py-1.5 rounded-xl text-xs font-medium text-[#9f1239] cursor-pointer"
          >
            Broken format example
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            className="neu-inset flex-1 rounded-xl px-3.5 py-2.5 font-mono text-xs sm:text-sm text-[#161922] focus:outline-none"
          />
          <button
            onClick={() => selectPreset(customInput, 0)}
            className="neu-btn px-4 py-2.5 rounded-xl text-xs font-medium text-[#161922] cursor-pointer"
          >
            Load line
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => goToStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="neu-btn inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#161922] disabled:opacity-40 cursor-pointer"
          >
            <SkipBack className="w-3.5 h-3.5" /> Prev
          </button>

          <button
            onClick={() => {
              if (playing) {
                setPlaying(false)
                stopNarration()
              } else {
                if (step === STEPS.length - 1) setStep(0)
                setPlaying(true)
              }
            }}
            className="neu-btn-dark inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{playing ? 'Pause' : voiceEnabled ? 'Play narrated walkthrough' : 'Auto-play'}</span>
          </button>

          <button
            onClick={() => goToStep(Math.min(STEPS.length - 1, step + 1))}
            disabled={step === STEPS.length - 1}
            className="neu-btn inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#161922] disabled:opacity-40 cursor-pointer"
          >
            Next <SkipForward className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => goToStep(0)}
            className="neu-btn p-2 rounded-xl text-[#647084] hover:text-[#161922] cursor-pointer"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (voiceEnabled) stopNarration()
              setVoiceEnabled((v) => !v)
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition ${
              voiceEnabled ? 'neu-inset text-[#161922] font-semibold' : 'neu-btn text-[#647084]'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{voiceEnabled ? 'Voice on' : 'Voice off'}</span>
          </button>

          {!voiceEnabled && (
            <div className="neu-inset p-1 rounded-xl flex items-center gap-1">
              <button
                onClick={() => setFast(false)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                  !fast ? 'neu-card-sm text-[#161922]' : 'text-[#647084]'
                }`}
              >
                1x
              </button>
              <button
                onClick={() => setFast(true)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                  fast ? 'neu-card-sm text-[#161922]' : 'text-[#647084]'
                }`}
              >
                2x
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stepper Track */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {STEPS.map((s) => {
          const active = step === s.id
          const done = step > s.id
          return (
            <button
              key={s.id}
              onClick={() => goToStep(s.id)}
              className={`px-3 py-2.5 rounded-xl text-left text-xs font-medium transition cursor-pointer ${
                active
                  ? 'neu-btn-dark font-semibold'
                  : done
                  ? 'neu-inset text-[#161922]'
                  : 'neu-btn text-[#647084]'
              }`}
            >
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Stage Card */}
      <div className="neu-card rounded-2xl p-6 min-h-[320px] space-y-6">
        <div className="code-well rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-xs sm:text-sm text-zinc-100">{STEPS[step].code}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => (speaking ? stopNarration() : speakStep(step, false))}
              disabled={ttsLoading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-zinc-100 cursor-pointer transition"
            >
              {ttsLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
                </>
              ) : speaking ? (
                <>
                  <Square className="w-3 h-3 fill-current" /> Stop
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" /> Listen
                </>
              )}
            </button>
            <span className="font-mono text-[11px] text-zinc-400">
              {step + 1} / 6
            </span>
          </div>
        </div>

        {ttsError && (
          <div className="text-xs text-[#9f1239] bg-[#fbe9ec] px-3 py-2 rounded-xl">
            {ttsError}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="s0"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
              className="space-y-4"
            >
              <p className="text-sm text-[#2c3340]">
                <strong className="text-[#161922]">Raw line from file:</strong>{' '}
                <span className="font-mono">readlines()</span> returns each line with an invisible newline character{' '}
                <span className="font-mono text-[#be123c]">\n</span> attached to the end.
              </p>
              <div className="neu-inset rounded-xl p-5 flex flex-wrap items-center gap-2 font-mono text-sm sm:text-base text-[#161922]">
                <span>"{lineText}</span>
                <span className="px-2 py-0.5 rounded-md bg-[#fbe9ec] text-[#be123c] font-semibold text-xs">
                  \n
                </span>
                <span>"</span>
              </div>
              <p className="text-xs text-[#647084]">
                Without removing <span className="font-mono">\n</span>, the role would equal{' '}
                <span className="font-mono">"{rightPart || 'Role'}\n"</span> and fail exact role comparisons later.
              </p>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
              className="space-y-4"
            >
              <p className="text-sm text-[#2c3340]">
                <strong className="text-[#161922]">Clean with replace():</strong> Replaces{' '}
                <span className="font-mono">"\n"</span> with an empty string <span className="font-mono">""</span>.
              </p>
              <div className="neu-inset rounded-xl p-5 flex flex-wrap items-center gap-3 font-mono text-sm sm:text-base text-[#161922]">
                <span>"{lineText}"</span>
                <span className="text-xs text-[#8793a6] line-through">\n removed</span>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="s2"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
              className="space-y-4"
            >
              <p className="text-sm text-[#2c3340]">
                <strong className="text-[#161922]">Split on separator:</strong>{' '}
                <span className="font-mono">split(" | Role: ")</span> cuts the line into a two-item list called{' '}
                <span className="font-mono">parts</span>.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="neu-inset rounded-xl p-4">
                  <div className="text-[11px] font-mono text-[#647084] mb-1">parts[0]</div>
                  <div className="font-mono text-sm sm:text-base font-semibold text-[#161922]">
                    "{leftPart}"
                  </div>
                </div>
                {hasTwoParts ? (
                  <div className="neu-inset rounded-xl p-4">
                    <div className="text-[11px] font-mono text-[#647084] mb-1">parts[1] (role ready)</div>
                    <div className="font-mono text-sm sm:text-base font-semibold text-[#161922]">
                      "{rightPart}"
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl p-4 bg-[#fbe9ec] text-xs text-[#9f1239] flex items-center">
                    Separator " | Role: " not found — len(parts) is {parts.length} instead of 2.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="s3"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
              className="space-y-4"
            >
              <p className="text-sm text-[#2c3340]">
                <strong className="text-[#161922]">Character slicing:</strong> Indices 0–5 hold{' '}
                <span className="font-mono">"Name: "</span> (6 characters). Writing{' '}
                <span className="font-mono font-semibold text-[#2563eb]">[6:]</span> slices from index 6 to the end.
              </p>
              <div className="flex flex-wrap gap-1.5 py-1">
                {leftPart.split('').map((ch, idx) => {
                  const isPrefix = idx < 6
                  return (
                    <motion.div
                      key={`${idx}-${ch}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: isPrefix ? 0 : -3 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`flex flex-col items-center min-w-[32px] px-1.5 py-2 rounded-lg font-mono ${
                        isPrefix
                          ? 'neu-inset text-[#7a869a]'
                          : 'neu-card-sm text-[#161922] font-semibold'
                      }`}
                    >
                      <span className="text-sm">{ch === ' ' ? '␣' : ch}</span>
                      <span className="text-[10px] opacity-55 mt-0.5">{idx}</span>
                    </motion.div>
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-3 text-xs font-mono text-[#475569]">
                <span className="neu-inset px-3 py-1.5 rounded-lg">parts[0][0:6] → "{prefix}"</span>
                <span className="neu-card-sm px-3 py-1.5 rounded-lg text-[#161922] font-semibold">
                  parts[0][6:] → "{extractedName}"
                </span>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="s4"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm text-[#2c3340]">
                  <strong className="text-[#161922]">Format validation:</strong> All four conditions must pass before loading.
                </p>
                <span className="font-mono text-xs font-semibold px-3 py-1 rounded-lg neu-inset text-[#161922]">
                  file_valid = {allValid ? 'True' : 'False'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'len(parts) == 2', ok: hasTwoParts },
                  { label: 'parts[0][0:6] == "Name: "', ok: checkPrefix },
                  { label: 'parts[0][6:] != ""', ok: checkName },
                  { label: 'parts[1] != ""', ok: checkRole },
                ].map((c) => (
                  <div
                    key={c.label}
                    className="neu-inset rounded-xl px-4 py-3 flex items-center justify-between font-mono text-xs"
                  >
                    <span className="text-[#2c3340]">{c.label}</span>
                    <span className={`inline-flex items-center gap-1 font-semibold ${c.ok ? 'text-[#15803d]' : 'text-[#be123c]'}`}>
                      {c.ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      {c.ok ? 'True' : 'False'}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="s5"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
              className="space-y-4"
            >
              {allValid ? (
                <>
                  <p className="text-sm text-[#2c3340]">
                    <strong className="text-[#161922]">Appended to parallel lists:</strong> Both items are added at the exact same index.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="neu-inset rounded-xl p-4">
                      <div className="text-[11px] font-mono text-[#647084] mb-1">member_list.append(...)</div>
                      <div className="font-mono text-base font-semibold text-[#161922]">"{extractedName}"</div>
                    </div>
                    <div className="neu-inset rounded-xl p-4">
                      <div className="text-[11px] font-mono text-[#647084] mb-1">member_roles.append(...)</div>
                      <div className="font-mono text-base font-semibold text-[#161922]">"{rightPart}"</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl p-4 bg-[#fbe9ec] text-sm text-[#9f1239]">
                  Skipped <span className="font-mono">append()</span> because <span className="font-mono">file_valid</span> is False.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="neu-inset rounded-2xl p-4 text-xs sm:text-sm text-[#475569]">
        <strong className="text-[#161922]">Why does this run before the while loop?</strong> Code inside{' '}
        <span className="font-mono">def</span> waits to be called, whereas top-level code runs immediately on startup so previous records are loaded before any save overwrites the file.
      </div>
    </div>
  )
}
