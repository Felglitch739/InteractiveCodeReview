import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, SkipBack, SkipForward, RotateCcw, Scissors,
  CheckCircle2, XCircle, AlertTriangle, FileText, ArrowRight,
  ListPlus, Volume2, VolumeX, Loader2, Square
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

  useEffect(() => {
    return () => stopNarration()
  }, [])

  const speakStep = async (targetStep, autoAdvanceAfter = false) => {
    stopNarration()
    const token = activeTokenRef.current
    setTtsError('')
    setTtsLoading(true)

    try {
      const script = getStepNarration(targetStep, parsedInfo)
      // Preload next step in background so transitions have 0ms wait
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
    } catch (err) {
      if (token !== activeTokenRef.current) return
      setTtsLoading(false)
      setSpeaking(false)
      setTtsError('Voice narration unavailable right now—switched to silent timer.')
      if (autoAdvanceAfter) {
        advanceTimerRef.current = setTimeout(() => {
          if (token !== activeTokenRef.current) return
          if (targetStep < STEPS.length - 1) setStep(targetStep + 1)
          else setPlaying(false)
        }, fast ? 1100 : 2100)
      }
    }
  }

  // Handle Auto-Play (syncs with HD voice if voiceEnabled, or uses timer if muted)
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
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky-400 mb-1.5">
          <FileText className="w-3.5 h-3.5" /> Module 02 · Startup Parsing Pipeline
        </span>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
          Visual Lab: <code className="text-sky-400">replace()</code>, <code className="text-violet-400">split()</code> &amp; <code className="text-emerald-400">[6:]</code>
        </h2>
        <p className="text-zinc-400 text-sm md:text-base mt-1 max-w-3xl">
          Watch — and <strong>listen</strong> — step by step as Python cleans a line from <code className="text-zinc-200">directory.txt</code>,
          cuts it apart, slices off <code className="text-zinc-200">"Name: "</code>, and loads it into both parallel lists before the menu opens.
        </p>
      </div>

      {/* Preset Selector */}
      <div className="rounded-2xl border border-zinc-800 studio-card p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {INITIAL_MEMBERS.map((m, idx) => {
            const full = `Name: ${m.name} | Role: ${m.role}`
            const active = lineText === full
            return (
              <button
                key={m.id}
                onClick={() => selectPreset(full, 0)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  active
                    ? 'bg-emerald-500/15 border-emerald-500/45 text-emerald-200'
                    : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                #{idx + 1} {m.name.split(' ')[0]} · {m.role}
              </button>
            )
          })}
          <button
            onClick={() => selectPreset('Sara Astorga - Vice President', 2)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
          >
            Test Broken Line
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none rounded-xl px-3.5 py-2 font-mono text-xs md:text-sm text-zinc-100"
          />
          <button
            onClick={() => selectPreset(customInput, 0)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white transition cursor-pointer"
          >
            Load Custom Line
          </button>
        </div>
      </div>

      {/* Transport & Voice Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => goToStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 disabled:opacity-40 cursor-pointer transition"
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
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 cursor-pointer transition"
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {playing ? 'Pause Walkthrough' : voiceEnabled ? 'Play Narrated Walkthrough' : 'Auto-Play Steps'}
          </button>

          <button
            onClick={() => goToStep(Math.min(STEPS.length - 1, step + 1))}
            disabled={step === STEPS.length - 1}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 disabled:opacity-40 cursor-pointer transition"
          >
            Next <SkipForward className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => goToStep(0)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (voiceEnabled) stopNarration()
              setVoiceEnabled((v) => !v)
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition ${
              voiceEnabled
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {voiceEnabled ? 'HD Voice On' : 'Voice Off'}
          </button>

          {!voiceEnabled && (
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              <button
                onClick={() => setFast(false)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  !fast ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                1x
              </button>
              <button
                onClick={() => setFast(true)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  fast ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                2x
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stepper Timeline */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {STEPS.map((s) => {
          const active = step === s.id
          const done = step > s.id
          return (
            <button
              key={s.id}
              onClick={() => goToStep(s.id)}
              className={`relative px-3 py-2.5 rounded-xl text-left text-xs font-semibold border transition cursor-pointer ${
                active
                  ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-lg shadow-emerald-500/10'
                  : done
                  ? 'bg-zinc-900/90 border-emerald-500/30 text-emerald-300'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Animated Visual Stage */}
      <div className="rounded-2xl border border-zinc-800 bg-[#0d0d12] p-6 min-h-[330px] shadow-2xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 mb-6 font-mono text-xs md:text-sm">
          <span className="text-emerald-300">{STEPS[step].code}</span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => (speaking ? stopNarration() : speakStep(step, false))}
              disabled={ttsLoading}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-sans text-xs font-semibold border cursor-pointer transition ${
                speaking
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25'
              }`}
            >
              {ttsLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading voice...
                </>
              ) : speaking ? (
                <>
                  <Square className="w-3 h-3 fill-current" /> Stop Voice
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" /> Listen to Step {step + 1}
                </>
              )}
            </button>
            <span className="text-zinc-500 text-xs">Step {step + 1} / 6</span>
          </div>
        </div>

        {ttsError && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
            {ttsError}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="space-y-4"
            >
              <p className="text-sm text-zinc-300">
                <strong className="text-white">Raw line from file:</strong> When <code className="text-sky-300">readlines()</code> reads a line from <code className="text-sky-300">directory.txt</code>, it includes an invisible newline character <code className="text-rose-400">\n</code> at the end.
              </p>
              <div className="flex flex-wrap items-center gap-2 p-5 rounded-xl bg-zinc-950 border border-dashed border-zinc-700 font-mono text-base">
                <span className="text-emerald-300">"{lineText}</span>
                <motion.span
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/50 text-rose-300 font-bold text-sm"
                >
                  \n
                </motion.span>
                <span className="text-emerald-300">"</span>
              </div>
              <p className="text-xs text-zinc-400">
                If we leave <code className="text-rose-300">\n</code> attached, the role would be <code className="text-zinc-300">"{rightPart || 'Role'}\n"</code> and comparing it against <code className="text-zinc-300">"{rightPart || 'Role'}"</code> would fail!
              </p>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="space-y-4"
            >
              <p className="text-sm text-zinc-300">
                <strong className="text-white">Cleaning with <code>replace()</code>:</strong> Finds <code className="text-rose-300">"\n"</code> and replaces it with an empty string <code className="text-emerald-300">""</code>.
              </p>
              <div className="flex flex-wrap items-center gap-3 p-5 rounded-xl bg-zinc-950 border border-emerald-500/30 font-mono text-base">
                <span className="text-emerald-300">"{lineText}"</span>
                <motion.span
                  initial={{ opacity: 1, scale: 1, x: 0 }}
                  animate={{ opacity: 0.35, scale: 0.85, x: 10 }}
                  transition={{ duration: 0.6 }}
                  className="px-2.5 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-400 line-through text-xs"
                >
                  \n removed
                </motion.span>
              </div>
              <p className="text-xs text-zinc-400">
                Now <code className="text-zinc-200">line</code> is completely clean and ready to be cut apart.
              </p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="space-y-4"
            >
              <p className="text-sm text-zinc-300">
                <strong className="text-white">Cutting with <code>split(" | Role: ")</code>:</strong> Searches for the exact separator and splits the string into a 2-item list called <code className="text-sky-300">parts</code>.
              </p>
              <div className="flex flex-col md:flex-row items-stretch gap-4">
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                  className="flex-1 p-4 rounded-xl bg-sky-500/15 border border-sky-500/40"
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider text-sky-300 mb-1">
                    parts[0] · Left side
                  </div>
                  <div className="font-mono text-base font-bold text-white">"{leftPart}"</div>
                </motion.div>

                <motion.div
                  initial={{ scale: 0.6, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/35 text-rose-300 text-xs font-bold shrink-0"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  {hasTwoParts ? 'Cut at " | Role: "' : `Not found (len=${parts.length})`}
                </motion.div>

                {hasTwoParts && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.08 }}
                    className="flex-1 p-4 rounded-xl bg-amber-500/15 border border-amber-500/40"
                  >
                    <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-1">
                      parts[1] · Role is ready!
                    </div>
                    <div className="font-mono text-base font-bold text-white">"{rightPart}"</div>
                  </motion.div>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                <code className="text-amber-300">parts[1]</code> already has the clean role, while <code className="text-sky-300">parts[0]</code> still has <code className="text-zinc-200">"Name: "</code> in front of the person's name.
              </p>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="space-y-4"
            >
              <p className="text-sm text-zinc-300">
                <strong className="text-white">Why index 6?</strong> Every character in <code className="text-sky-300">parts[0]</code> has an index starting at 0. Indices <strong className="text-violet-300">0–5</strong> are <code className="text-violet-300">"Name: "</code> (6 characters). Slicing <code className="text-emerald-300">[6:]</code> grabs everything from index 6 to the end:
              </p>

              <div className="flex flex-wrap gap-1.5 py-2">
                {leftPart.split('').map((ch, idx) => {
                  const isPrefix = idx < 6
                  return (
                    <motion.div
                      key={`${idx}-${ch}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: isPrefix ? 0 : -4 }}
                      transition={{ delay: idx * 0.025, type: 'spring', stiffness: 340, damping: 22 }}
                      className={`flex flex-col items-center min-w-[32px] px-1.5 py-2 rounded-lg border font-mono ${
                        isPrefix
                          ? 'bg-violet-500/15 border-violet-500/40 text-violet-200'
                          : 'bg-emerald-500/15 border-emerald-500/45 text-emerald-200 shadow-md shadow-emerald-500/10'
                      }`}
                    >
                      <span className="text-sm font-bold">{ch === ' ' ? '␣' : ch}</span>
                      <span className="text-[10px] opacity-65 mt-0.5">{idx}</span>
                    </motion.div>
                  )
                })}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-violet-500/15 border border-violet-500/30 text-violet-200">
                  parts[0][0:6] → "{prefix}"
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-200">
                  parts[0][6:] → "{extractedName}"
                </span>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm text-zinc-300">
                  <strong className="text-white">Safety Check:</strong> Python verifies all 4 conditions before adding to the lists.
                </p>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                    allValid
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  }`}
                >
                  file_valid = {allValid ? 'True' : 'False'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'len(parts) == 2', ok: hasTwoParts },
                  { label: 'parts[0][0:6] == "Name: "', ok: checkPrefix },
                  { label: 'parts[0][6:] != ""', ok: checkName },
                  { label: 'parts[1] != ""', ok: checkRole },
                ].map((c, idx) => (
                  <motion.div
                    key={c.label}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.08 }}
                    className={`flex items-center justify-between p-3.5 rounded-xl border font-mono text-xs ${
                      c.ok
                        ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-200'
                        : 'bg-rose-500/10 border-rose-500/35 text-rose-200'
                    }`}
                  >
                    <span>{c.label}</span>
                    <span className="inline-flex items-center gap-1 font-bold">
                      {c.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                      {c.ok ? 'True' : 'False'}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="space-y-4"
            >
              {allValid ? (
                <>
                  <p className="text-sm text-zinc-300">
                    <strong className="text-white">Loaded into parallel lists!</strong> Both values are appended at the exact same index so they stay paired together.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40"
                    >
                      <div className="flex items-center justify-between text-xs font-mono text-emerald-300 mb-2">
                        <span>member_list.append(...)</span>
                        <ListPlus className="w-3.5 h-3.5" />
                      </div>
                      <div className="font-mono text-lg font-bold text-white">"{extractedName}"</div>
                    </motion.div>

                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                      className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40"
                    >
                      <div className="flex items-center justify-between text-xs font-mono text-amber-300 mb-2">
                        <span>member_roles.append(...)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                      <div className="font-mono text-lg font-bold text-white">"{rightPart}"</div>
                    </motion.div>
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-200 text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Skipped <code>append()</code>!</strong> Because <code>file_valid</code> became <code>False</code>, this malformed line is not added to the lists and Python prints a warning message.
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-100">
        <strong className="text-white">Why does this run BEFORE the <code>while</code> loop?</strong>{' '}
        Code inside <code className="text-sky-300">def</code> waits until called, but code outside runs automatically from top to bottom on startup. Without this block, lists would start empty and saving with <code className="text-sky-300">"w"</code> would overwrite older members.
      </div>
    </div>
  )
}
