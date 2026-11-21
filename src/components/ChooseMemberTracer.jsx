import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, RotateCcw, Check } from 'lucide-react'
import { INITIAL_MEMBERS } from '../data/projectData'

const PRESETS = [
  { label: '"2" (Sara)', val: '2' },
  { label: '"1" (Jeremy)', val: '1' },
  { label: '"5" (Luis)', val: '5' },
  { label: '"0" (Cancel)', val: '0' },
  { label: '"9" (Invalid)', val: '9' },
  { label: '"hello" (Text)', val: 'hello' },
]

export default function ChooseMemberTracer() {
  const [choice, setChoice] = useState('2')
  const [customVal, setCustomVal] = useState('2')
  const [activeIter, setActiveIter] = useState(INITIAL_MEMBERS.length)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (!animating) return
    const timer = setInterval(() => {
      setActiveIter((prev) => {
        if (choice === '0' || prev >= INITIAL_MEMBERS.length) {
          setAnimating(false)
          return INITIAL_MEMBERS.length
        }
        return prev + 1
      })
    }, 580)
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

  const foundSoFar = matchedIndex !== -1 && activeIter >= matchedIndex ? matchedIndex : -1
  const doneChecking = activeIter >= INITIAL_MEMBERS.length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">
          How <span className="font-mono">choose_member()</span> Works
        </h2>
        <p className="text-sm text-ink-muted mt-1 max-w-2xl">
          Converts the 1-based number displayed on screen into the real 0-based list index, returning{' '}
          <span className="font-mono text-ink">-1</span> if the user enters{' '}
          <span className="font-mono text-ink">0</span> to cancel.
        </p>
      </div>

      {/* Controls */}
      <div className="neu-card rounded-2xl p-5 space-y-3.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          Test an input value
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.val}
              onClick={() => startTrace(p.val)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                choice === p.val ? 'neu-btn-primary' : 'neu-btn text-ink-2'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2.5">
          <input
            type="text"
            value={customVal}
            onChange={(e) => setCustomVal(e.target.value)}
            placeholder="Try any input..."
            className="neu-inset flex-1 min-w-[180px] rounded-xl px-3.5 py-2 font-mono text-xs text-ink focus:outline-none"
          />
          <button
            onClick={() => startTrace(customVal)}
            className="neu-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" /> Trace loop
          </button>
          <button
            onClick={() => {
              setAnimating(false)
              setActiveIter(INITIAL_MEMBERS.length)
            }}
            className="neu-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Instant result
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 neu-card rounded-2xl p-5 space-y-4">
          <div className="code-well rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
            <span>while position == -1 and member_choice != "0":</span>
            <span className="text-zinc-300 font-semibold">position = {foundSoFar}</span>
          </div>

          {choice === '0' ? (
            <div className="neu-inset rounded-xl p-5 text-sm text-ink-2 space-y-1.5">
              <div className="font-semibold text-ink">Canceled with "0"</div>
              <p className="text-xs text-ink-muted leading-relaxed">
                <span className="font-mono">member_choice != "0"</span> becomes False, the loop exits immediately, and the function executes{' '}
                <span className="font-mono">return -1</span>.
              </p>
            </div>
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
                    className={`relative flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition ${
                      isMatch
                        ? 'neu-btn-primary'
                        : isCurrent
                        ? 'neu-card-sm text-ink'
                        : 'neu-inset text-ink-muted'
                    }`}
                  >
                    {isCurrent && !isMatch && (
                      <motion.div
                        layoutId="neuLoopPointer"
                        style={{ backgroundColor: 'var(--accent-bar)' }}
                        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      />
                    )}

                    <div className="flex items-center gap-3 min-w-0 font-mono text-xs">
                      <span className="font-semibold">i = {i}</span>
                      <span className="truncate">
                        "{choice}" == "{visible}" ({m.name.split(' ')[0]})
                      </span>
                    </div>

                    <div className="shrink-0 font-mono text-xs font-semibold">
                      {!isChecked ? (
                        <span className="opacity-45">…</span>
                      ) : isMatch ? (
                        <span className="inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> pos = {i}
                        </span>
                      ) : (
                        <span className="opacity-55">False</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {doneChecking && choice !== '0' && matchedIndex === -1 && (
            <div className="state-err rounded-xl p-3.5 text-xs">
              No match found—<span className="font-mono">position</span> stays <span className="font-mono">-1</span>, so the loop prints an error and asks again without crashing.
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="neu-card rounded-2xl p-6 space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Return Value
            </div>
            <div className="text-2xl font-mono font-semibold text-ink">
              {choice === '0'
                ? 'return -1'
                : matchedIndex !== -1 && doneChecking
                ? `return ${matchedIndex}`
                : !doneChecking
                ? 'Tracing...'
                : 'Repeats loop'}
            </div>
            <p className="text-sm text-ink-2 leading-relaxed">
              {choice === '0'
                ? 'The main menu checks if position != -1:, sees -1, and safely skips any edit or deletion.'
                : matchedIndex !== -1
                ? `The user entered "${choice}" (${INITIAL_MEMBERS[matchedIndex].name}) and receives list index ${matchedIndex}.`
                : 'Comparing strings instead of calling int(input()) means typing letters never crashes Python.'}
            </p>
          </div>

          <div className="neu-inset rounded-2xl p-5 space-y-2">
            <div className="text-xs font-semibold text-ink">
              Why initialize position to -1 instead of 0?
            </div>
            <p className="text-xs sm:text-sm text-ink-2 leading-relaxed">
              Index <span className="font-mono text-ink">0</span> is already Jeremy Hernández. Starting at{' '}
              <span className="font-mono text-ink">-1</span> distinguishes “nobody selected yet” from selecting the first member.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
