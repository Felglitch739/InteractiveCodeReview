import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Crosshair, Play, RotateCcw, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { INITIAL_MEMBERS } from '../data/projectData'

const PRESETS = [
  { label: '"2" → Sara (index 1)', val: '2' },
  { label: '"1" → Jeremy (index 0)', val: '1' },
  { label: '"5" → Luis (index 4)', val: '5' },
  { label: '"0" → Cancel (-1)', val: '0' },
  { label: '"9" → Out of range', val: '9' },
  { label: '"hello" → Text (safe)', val: 'hello' },
]

export default function ChooseMemberTracer() {
  const [choice, setChoice] = useState('2')
  const [customVal, setCustomVal] = useState('2')
  const [activeIter, setActiveIter] = useState(INITIAL_MEMBERS.length) // -1 before start, 0..4 checking, 5 done
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (!animating) return
    const timer = setInterval(() => {
      setActiveIter((prev) => {
        if (choice === '0') {
          setAnimating(false)
          return INITIAL_MEMBERS.length
        }
        if (prev >= INITIAL_MEMBERS.length) {
          setAnimating(false)
          return prev
        }
        return prev + 1
      })
    }, 650)
    return () => clearInterval(timer)
  }, [animating, choice])

  const startTrace = (val) => {
    setChoice(val)
    setCustomVal(val)
    if (val === '0') {
      setAnimating(false)
      setActiveIter(INITIAL_MEMBERS.length)
    } else {
      setActiveIter(0)
      setAnimating(true)
    }
  }

  let matchedIndex = -1
  if (choice !== '0') {
    INITIAL_MEMBERS.forEach((_, i) => {
      if (choice === String(i + 1)) matchedIndex = i
    })
  }

  const foundSoFar =
    matchedIndex !== -1 && activeIter >= matchedIndex ? matchedIndex : -1
  const doneChecking = activeIter >= INITIAL_MEMBERS.length

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-400 mb-1.5">
          <Crosshair className="w-3.5 h-3.5" /> Module 04 · Index Conversion &amp; Sentinel Value
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          How <code className="text-rose-400">choose_member()</code> &amp; <code className="text-amber-300">position = -1</code> Work
        </h2>
        <p className="text-zinc-400 text-sm md:text-base mt-1 max-w-3xl">
          This function never deletes or edits anyone—it only converts the 1-based number on screen into the real 0-based list index.
          Pick any test input and watch the <code className="text-zinc-200">for</code> loop step through each member.
        </p>
      </div>

      {/* Controls */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.val}
              onClick={() => startTrace(p.val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition ${
                choice === p.val
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-200'
                  : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={customVal}
            onChange={(e) => setCustomVal(e.target.value)}
            placeholder="Try any input..."
            className="flex-1 min-w-[180px] bg-zinc-950 border border-zinc-800 focus:border-rose-500 focus:outline-none rounded-xl px-3.5 py-2 font-mono text-xs text-white"
          />
          <button
            onClick={() => startTrace(customVal)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition"
          >
            <Play className="w-3.5 h-3.5" /> Animate Loop
          </button>
          <button
            onClick={() => {
              setAnimating(false)
              setActiveIter(INITIAL_MEMBERS.length)
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Show Instant Result
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Live Animated Loop Rows */}
        <div className="lg:col-span-7 rounded-2xl border border-zinc-800 bg-[#0d0d12] p-5 space-y-4 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-xs">
            <span className="text-violet-300">
              while position == -1 and member_choice != "0":
            </span>
            <span className="text-amber-300 font-bold">
              position = {foundSoFar}
            </span>
          </div>

          {choice === '0' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-sm space-y-2"
            >
              <div className="font-bold flex items-center gap-2 text-rose-300">
                <XCircle className="w-4 h-4" /> User entered "0" → Cancel Signal!
              </div>
              <p className="text-xs leading-relaxed">
                No member matches <code>"0"</code>, and the <code>while</code> condition <code>member_choice != "0"</code> becomes <strong>False</strong>.
                The function immediately exits and executes <code>return -1</code>.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {INITIAL_MEMBERS.map((m, i) => {
                const visible = String(i + 1)
                const isCurrent = activeIter === i
                const isChecked = activeIter >= i
                const isMatch = isChecked && choice === visible

                return (
                  <div
                    key={m.id}
                    className={`relative flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                      isMatch
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-100'
                        : isCurrent
                        ? 'bg-indigo-500/15 border-indigo-400/60 text-white'
                        : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-400'
                    }`}
                  >
                    {isCurrent && (
                      <motion.div
                        layoutId="loopPointer"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-400 rounded-l-xl"
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      />
                    )}

                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700 text-indigo-300">
                        i = {i}
                      </span>
                      <div className="font-mono text-xs truncate">
                        <span className="text-zinc-400">"{choice}" == str({i}+1)</span>{' '}
                        <span className="text-zinc-500">→</span>{' '}
                        <span className="text-amber-300 font-semibold">"{visible}"</span>{' '}
                        <span className="text-zinc-500">({m.name.split(' ')[0]})</span>
                      </div>
                    </div>

                    <div className="shrink-0 font-mono text-xs font-bold">
                      {!isChecked ? (
                        <span className="text-zinc-600">waiting...</span>
                      ) : isMatch ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" /> Match! pos = {i}
                        </span>
                      ) : (
                        <span className="text-zinc-500">False</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {doneChecking && choice !== '0' && matchedIndex === -1 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/35 text-xs text-rose-200"
            >
              <strong>No match found!</strong> <code>position</code> stayed <code>-1</code>, so Python prints{' '}
              <em>"Invalid member number. Please try again."</em> and repeats the <code>while</code> loop without crashing.
            </motion.div>
          )}
        </div>

        {/* Right: Return Value & Why -1 */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Return Value
            </div>
            <div className="text-2xl font-mono font-extrabold text-white">
              {choice === '0' ? (
                <span className="text-rose-400">return -1</span>
              ) : matchedIndex !== -1 && doneChecking ? (
                <span className="text-emerald-400">return {matchedIndex}</span>
              ) : !doneChecking ? (
                <span className="text-indigo-400">Checking loop...</span>
              ) : (
                <span className="text-amber-300">Loops again (position == -1)</span>
              )}
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {choice === '0'
                ? 'The main menu checks if position != -1:. Since it is -1, it cancels safely without modifying any list.'
                : matchedIndex !== -1
                ? `The user typed "${choice}" (${INITIAL_MEMBERS[matchedIndex].name}), and the function returns real list index ${matchedIndex}.`
                : 'Because we compare text strings instead of calling int(input()), typing letters or invalid numbers never crashes the program.'}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-5 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
              <AlertCircle className="w-4 h-4" /> Why start at -1 instead of 0?
            </div>
            <p className="text-sm text-amber-100/90 leading-relaxed">
              Index <code className="font-bold text-white">0</code> is already a real member (<strong>Jeremy Hernández</strong>).
              If we started at <code>0</code>, Python couldn't tell the difference between <em>"nobody selected yet"</em> and{' '}
              <em>"the user picked Jeremy"</em>. Using <code>-1</code> as a sentinel—and checking <code>if position != -1:</code> before editing—keeps everything safe.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
