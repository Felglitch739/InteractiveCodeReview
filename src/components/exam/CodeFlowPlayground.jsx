import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Mic,
  ArrowUp,
  Check,
  Volume2,
  FileText,
} from 'lucide-react'
import { CODE_FLOW_TOPICS } from '../../data/codeFlowData'
import { FLOW_AUDIO_META } from '../../data/flowAudioMeta'
import PythonLine from '../PythonLine'

const SPRING_GLIDE = { type: 'spring', stiffness: 360, damping: 30 }

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function RollingValue({ value, className = '' }) {
  return (
    <span className={`inline-flex overflow-hidden align-bottom ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={String(value)}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function ListRibbonVisual({ ribbon, scenarioId }) {
  const count = ribbon.items.length
  const [sliceStart, sliceEnd] = ribbon.sliceRange || [-1, -1]
  const hasActive = typeof ribbon.activeIdx === 'number' && ribbon.activeIdx >= 0
  const showNextHint =
    hasActive && !ribbon.activeNeg && ribbon.activeIdx + 1 < count && !ribbon.removedNote

  return (
    <div className="neu-inset rounded-2xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-mono font-semibold text-ink">{ribbon.name}</span>
        <span className="font-mono text-[11px] text-ink-muted">len = {count}</span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex items-start gap-1.5 min-w-max">
          <AnimatePresence mode="popLayout">
            {ribbon.items.map((item, idx) => {
              const negIdx = idx - count
              const isActive = ribbon.activeIdx === idx
              const isMutated = ribbon.mutatedIdx === idx
              const isNextUp = showNextHint && idx === ribbon.activeIdx + 1
              const inSlice = sliceStart >= 0 && idx >= sliceStart && idx < sliceEnd

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.82 }}
                  transition={SPRING_GLIDE}
                  className="flex items-center gap-1.5"
                >
                  <div className="flex flex-col items-center gap-1 min-w-[74px]">
                    {/* Positive Index */}
                    <span
                      className={`font-mono text-[11px] px-1.5 py-0.5 rounded-md transition-colors ${
                        isActive && !ribbon.activeNeg
                          ? 'font-bold text-white'
                          : inSlice
                          ? 'font-semibold text-ink'
                          : 'text-ink-muted'
                      }`}
                      style={
                        isActive && !ribbon.activeNeg
                          ? { backgroundColor: 'var(--accent-bar)' }
                          : undefined
                      }
                    >
                      [{idx}]
                    </span>

                    {/* Value Cell with Gliding Ring */}
                    <div className="relative w-full">
                      {isActive && (
                        <motion.div
                          layoutId={`list-ring-${scenarioId}`}
                          transition={SPRING_GLIDE}
                          className="absolute -inset-[2px] rounded-[13px] pointer-events-none z-10"
                          style={{
                            border: '2px solid var(--accent-bar)',
                            backgroundColor: 'rgba(37, 99, 235, 0.08)',
                          }}
                        />
                      )}
                      {isMutated && (
                        <motion.div
                          initial={{ scale: 0.94, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.25 }}
                          className="absolute -inset-[2px] rounded-[13px] pointer-events-none z-10"
                          style={{
                            border: '2px solid #10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          }}
                        />
                      )}
                      {inSlice && !isActive && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute -inset-[2px] rounded-[13px] pointer-events-none z-10"
                          style={{
                            border: '2px dashed var(--accent-bar)',
                            backgroundColor: 'rgba(37, 99, 235, 0.07)',
                          }}
                        />
                      )}
                      <div
                        className={`relative w-full px-3 py-2.5 rounded-xl font-mono text-xs sm:text-[13px] font-semibold text-center transition-colors ${
                          isActive || isMutated || inSlice
                            ? 'neu-card-sm text-ink'
                            : isNextUp
                            ? 'neu-btn text-ink'
                            : 'neu-btn text-ink-2'
                        }`}
                      >
                        <RollingValue value={item.value} />
                      </div>
                    </div>

                    {/* Negative Index */}
                    <span
                      className={`font-mono text-[10.5px] px-1.5 py-0.5 rounded-md transition-colors ${
                        isActive && ribbon.activeNeg
                          ? 'font-bold text-white'
                          : 'text-ink-muted opacity-80'
                      }`}
                      style={
                        isActive && ribbon.activeNeg
                          ? { backgroundColor: 'var(--accent-bar)' }
                          : undefined
                      }
                    >
                      [{negIdx}]
                    </span>

                    {/* Gliding Tracking Pointer / Next / Mutated Pill */}
                    <div className="h-5 flex items-center justify-center">
                      {isActive ? (
                        <motion.div
                          layoutId={`list-ptr-${scenarioId}`}
                          transition={SPRING_GLIDE}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold text-white"
                          style={{ backgroundColor: 'var(--accent-bar)' }}
                        >
                          <ArrowUp className="w-2.5 h-2.5" />
                          <span>{ribbon.activeNeg ? negIdx : idx}</span>
                        </motion.div>
                      ) : isMutated ? (
                        <span className="px-1.5 py-0.5 rounded-md font-mono text-[9.5px] font-semibold bg-emerald-600/15 text-emerald-700 dark:text-emerald-300">
                          updated
                        </span>
                      ) : isNextUp ? (
                        <span className="font-mono text-[9.5px] text-ink-muted opacity-75">
                          next
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Subtle traversal arrow between boxes */}
                  {idx < count - 1 && (
                    <ChevronRight
                      className={`w-3.5 h-3.5 -mt-5 shrink-0 transition-colors ${
                        isActive ? 'opacity-90' : 'text-ink-muted opacity-30'
                      }`}
                      style={isActive ? { color: 'var(--accent-bar)' } : undefined}
                    />
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {ribbon.sliceRange && (
        <div className="text-[11.5px] text-ink-2 font-mono">
          Slice [{sliceStart}:{sliceEnd}] → index {sliceStart} included, stops before {sliceEnd}
        </div>
      )}

      {ribbon.removedNote && (
        <div className="text-[11.5px] text-emerald-700 dark:text-emerald-300 font-medium">
          {ribbon.removedNote}
        </div>
      )}
    </div>
  )
}

function RangeTrackVisual({ track, scenarioId }) {
  return (
    <div className="neu-inset rounded-2xl p-3.5 space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono font-semibold text-ink">{track.expr}</span>
        <span className="text-[11px] text-ink-muted">Iteration sequence</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {track.values.map((val, idx) => {
          const isCurrent = idx === track.activeIdx
          const isDone = track.activeIdx > idx
          const isNext = track.activeIdx >= 0 && idx === track.activeIdx + 1
          return (
            <div key={val} className="inline-flex items-center gap-1.5">
              <div className="relative">
                {isCurrent && (
                  <motion.div
                    layoutId={`range-pill-${scenarioId}`}
                    transition={SPRING_GLIDE}
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{ backgroundColor: 'var(--accent-bar)' }}
                  />
                )}
                <div
                  className={`relative z-10 px-3 py-1.5 rounded-xl font-mono text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                    isCurrent
                      ? 'text-white'
                      : isDone
                      ? 'state-ok'
                      : isNext
                      ? 'neu-card-sm text-ink'
                      : 'neu-btn text-ink-muted'
                  }`}
                >
                  {isDone && <Check className="w-3 h-3" />}
                  <span>i = {val}</span>
                  {isNext && (
                    <span className="text-[9.5px] font-normal opacity-70">next</span>
                  )}
                </div>
              </div>
              {idx < track.values.length - 1 && (
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-colors ${
                    isCurrent ? 'opacity-100' : 'text-ink-muted opacity-35'
                  }`}
                  style={isCurrent ? { color: 'var(--accent-bar)' } : undefined}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ConditionGateVisual({ condition }) {
  return (
    <motion.div
      key={`${condition.expr}-${condition.result}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs ${
        condition.result ? 'state-ok' : 'state-err'
      }`}
    >
      <div className="font-mono font-semibold">
        {condition.expr} → {condition.result ? 'True' : 'False'}
      </div>
      {condition.detail && (
        <span className="text-[11.5px] font-medium opacity-90">{condition.detail}</span>
      )}
    </motion.div>
  )
}

function Grid2DVisual({ grid, scenarioId }) {
  const visitedSet = new Set(grid.visited || [])
  return (
    <div className="neu-inset rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-ink">2D Loop Grid (row × col)</span>
        <span className="font-mono text-[11px] text-ink-muted">
          {visitedSet.size} / {grid.rows * grid.cols} visited
        </span>
      </div>
      <div className="space-y-2">
        {Array.from({ length: grid.rows }).map((_, r) => (
          <div key={r} className="grid grid-cols-3 gap-2">
            {Array.from({ length: grid.cols }).map((__, c) => {
              const isActive = grid.active && grid.active[0] === r && grid.active[1] === c
              const isVisited = visitedSet.has(`${r},${c}`)
              return (
                <div key={`${r}-${c}`} className="relative">
                  {isActive && (
                    <motion.div
                      layoutId={`grid-cursor-${scenarioId}`}
                      transition={SPRING_GLIDE}
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      style={{ backgroundColor: 'var(--accent-bar)' }}
                    />
                  )}
                  <div
                    className={`relative z-10 rounded-xl py-2.5 px-2 text-center font-mono text-xs font-semibold transition-colors ${
                      isActive
                        ? 'text-white'
                        : isVisited
                        ? 'state-ok'
                        : 'neu-btn text-ink-muted'
                    }`}
                  >
                    ({r}, {c})
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function LoopTrackVisual({ track, scenarioId }) {
  const labelMap = {
    pending: 'waiting',
    active: 'checking',
    printed: 'printed',
    skipped: 'continue',
    stopped: 'break',
    unreached: 'unreached',
  }

  return (
    <div className="neu-inset rounded-2xl p-4 space-y-2.5">
      <div className="text-xs font-semibold text-ink">Loop Iteration Track · range(1, 6)</div>
      <div className="flex items-center gap-1 sm:gap-1.5">
        {track.items.map((item, idx) => {
          const isActive = item.status === 'active'
          const styleClass =
            isActive
              ? 'text-white'
              : item.status === 'printed'
              ? 'state-ok'
              : item.status === 'stopped'
              ? 'state-err'
              : item.status === 'skipped'
              ? 'neu-card-sm text-amber-700 dark:text-amber-300'
              : 'neu-btn text-ink-muted opacity-65'
          return (
            <div key={item.val} className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
              <div className="relative flex-1 min-w-0">
                {isActive && (
                  <motion.div
                    layoutId={`track-cursor-${scenarioId}`}
                    transition={SPRING_GLIDE}
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{ backgroundColor: 'var(--accent-bar)' }}
                  />
                )}
                <div
                  className={`relative z-10 rounded-xl p-2 text-center transition-colors ${styleClass}`}
                >
                  <div className="font-mono text-sm font-semibold">{item.val}</div>
                  <div className="text-[10px] font-medium mt-0.5 truncate">
                    {labelMap[item.status]}
                  </div>
                </div>
              </div>
              {idx < track.items.length - 1 && (
                <ChevronRight className="w-3 h-3 text-ink-muted opacity-35 shrink-0 hidden sm:block" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ScopeFramesVisual({ frames }) {
  return (
    <div className="space-y-3">
      <div className="neu-inset rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-ink">Global Frame</span>
          <span className="font-mono text-[11px] text-ink-muted">lives for entire program</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {frames.global.map((v) => (
            <div
              key={v.name}
              className="neu-card-sm rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs font-mono"
              style={
                v.changed ? { boxShadow: '0 0 0 1.5px rgba(16, 185, 129, 0.7)' } : undefined
              }
            >
              <span className="text-ink-muted">{v.name}</span>
              <RollingValue
                value={v.value}
                className={`font-semibold truncate ${
                  v.changed ? 'text-emerald-700 dark:text-emerald-300' : 'text-ink'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {frames.local ? (
          <motion.div
            key="local-open"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="neu-card-sm rounded-2xl p-4 space-y-2.5"
            style={{ boxShadow: '0 0 0 1.5px var(--accent-bar)' }}
          >
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-ink font-mono">
                Local Frame · {frames.local.fnName}
              </span>
              <span className="text-[11px] text-ink-muted">temporary</span>
            </div>

            {frames.local.vars.length === 0 ? (
              <div className="text-xs text-ink-muted font-mono">(empty local scope)</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {frames.local.vars.map((v) => (
                  <div
                    key={v.name}
                    className="neu-inset rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs font-mono"
                    style={
                      v.changed ? { boxShadow: '0 0 0 1.5px rgba(16, 185, 129, 0.7)' } : undefined
                    }
                  >
                    <span className="text-ink-muted">{v.name}</span>
                    <RollingValue
                      value={v.value}
                      className={`font-semibold truncate ${
                        v.changed ? 'text-emerald-700 dark:text-emerald-300' : 'text-ink'
                      }`}
                    />
                  </div>
                ))}
              </div>
            )}

            {frames.local.returning && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="state-ok rounded-xl px-3 py-1.5 font-mono text-xs font-semibold"
              >
                return → {frames.local.returning}
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="local-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="neu-inset rounded-2xl px-4 py-3 text-xs text-ink-muted font-mono"
          >
            No active function call (Local Frame does not exist right now).
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FileStateVisual({ fileState }) {
  const modeLabel = {
    w: 'OPEN · "w" (overwrite)',
    a: 'OPEN · "a" (append)',
    r: 'OPEN · "r" (read-only)',
    closed: 'CLOSED · saved on disk',
  }[fileState.mode]

  return (
    <div className="neu-inset rounded-2xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-mono font-semibold text-ink">{fileState.filename}</span>
        <span
          className={`px-2 py-0.5 rounded-lg font-mono text-[11px] font-semibold ${
            fileState.mode === 'w'
              ? 'state-err'
              : fileState.mode === 'closed'
              ? 'neu-card-sm text-ink-muted'
              : 'state-ok'
          }`}
        >
          {modeLabel}
        </span>
      </div>

      <div className="code-well rounded-xl px-3.5 py-3 font-mono text-xs space-y-1 min-h-[68px]">
        {fileState.lines.length === 0 ? (
          <div className="text-zinc-500 italic">(empty file — 0 bytes)</div>
        ) : (
          fileState.lines.map((ln, idx) => {
            const isNewest = fileState.highlightLast && idx === fileState.lines.length - 1
            return (
              <motion.div
                key={`${idx}-${ln}`}
                initial={isNewest ? { opacity: 0, x: -6 } : false}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-2.5 px-1.5 py-0.5 rounded ${
                  isNewest
                    ? 'bg-emerald-500/15 text-emerald-200'
                    : fileState.reading
                    ? 'bg-blue-500/15 text-blue-200'
                    : 'text-zinc-200'
                }`}
              >
                <span className="text-zinc-500 select-none">{idx + 1}</span>
                <span>{ln}</span>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}

function DictMapVisual({ dictMap }) {
  return (
    <div className="neu-inset rounded-2xl p-4 space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono font-semibold text-ink">{dictMap.name} (dict)</span>
        <span className="font-mono text-[11px] text-ink-muted">
          {dictMap.entries.length} pairs
        </span>
      </div>
      <div className="space-y-2">
        {dictMap.entries.map((e) => (
          <motion.div
            key={e.key}
            layout
            initial={e.added ? { opacity: 0, y: 6 } : false}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl px-3 py-2 flex items-center justify-between font-mono text-xs transition-all ${
              e.added || e.updated
                ? 'state-ok font-semibold'
                : e.active
                ? 'neu-card-sm font-semibold text-ink'
                : 'neu-btn text-ink-2'
            }`}
            style={e.active ? { boxShadow: '0 0 0 2px var(--accent-bar)' } : undefined}
          >
            <span>{e.key}</span>
            <span className="opacity-50">→</span>
            <RollingValue value={e.value} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function SetBagVisual({ setBag }) {
  return (
    <div className="neu-inset rounded-2xl p-4 space-y-3">
      <div className="text-xs font-mono font-semibold text-ink">{setBag.name}</div>
      <div className="flex flex-wrap gap-2">
        {setBag.items.map((item) => (
          <span
            key={item}
            className="neu-card-sm px-3 py-1.5 rounded-xl font-mono text-xs font-semibold text-ink"
          >
            {item}
          </span>
        ))}
      </div>
      {setBag.query && (
        <div className="state-ok rounded-xl px-3 py-1.5 font-mono text-xs font-semibold">
          {setBag.query.expr} → {String(setBag.query.result)}
        </div>
      )}
    </div>
  )
}

export default function CodeFlowPlayground({ initialTopicId, onAskTutor }) {
  const [topicId, setTopicId] = useState(() => initialTopicId || CODE_FLOW_TOPICS[0].id)
  const topic = CODE_FLOW_TOPICS.find((t) => t.id === topicId) || CODE_FLOW_TOPICS[0]

  const [scenarioIdx, setScenarioIdx] = useState(0)
  const scenario = topic.scenarios[scenarioIdx] || topic.scenarios[0]
  const audioMeta = FLOW_AUDIO_META[scenario.id]

  const [stepIdx, setStepIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1) // 1 or 1.5

  // HD Audio Walkthrough state (static MP3s in public/audio/flows — 0 API quota!)
  const audioRef = useRef(null)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioTime, setAudioTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [syncWithAudio, setSyncWithAudio] = useState(true)
  const [showTranscript, setShowTranscript] = useState(false)

  const step = scenario.steps[stepIdx] || scenario.steps[0]
  const prevStep = stepIdx > 0 ? scenario.steps[stepIdx - 1] : null
  const prevVarsMap = new Map((prevStep?.vars || []).map((v) => [v.name, v.value]))
  const totalSteps = scenario.steps.length
  const skippedSet = new Set(step.skippedLines || [])

  const stopAudio = () => {
    const el = audioRef.current
    if (el) {
      el.pause()
      el.currentTime = 0
    }
    setAudioPlaying(false)
    setAudioTime(0)
  }

  // Sync if parent jumps to a specific topic
  useEffect(() => {
    if (initialTopicId && CODE_FLOW_TOPICS.some((t) => t.id === initialTopicId)) {
      stopAudio()
      setTopicId(initialTopicId)
      setScenarioIdx(0)
      setStepIdx(0)
      setPlaying(false)
      setShowTranscript(false)
    }
  }, [initialTopicId])

  // Stop audio on unmount or scenario change
  useEffect(() => {
    setAudioDuration(0)
    setAudioTime(0)
    setAudioPlaying(false)
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [scenario.id])

  // Autoplay timer (disabled while synced HD audio drives the steps)
  useEffect(() => {
    if (!playing || (audioPlaying && syncWithAudio)) return
    if (stepIdx >= totalSteps - 1) {
      setPlaying(false)
      return
    }
    const delay = speed === 1.5 ? 1050 : 1650
    const timer = setTimeout(() => {
      setStepIdx((i) => Math.min(totalSteps - 1, i + 1))
    }, delay)
    return () => clearTimeout(timer)
  }, [playing, audioPlaying, syncWithAudio, stepIdx, totalSteps, speed])

  // Keyboard stepping (Left / Right)
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setPlaying(false)
        setStepIdx((i) => Math.min(totalSteps - 1, i + 1))
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setPlaying(false)
        setStepIdx((i) => Math.max(0, i - 1))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [totalSteps])

  const selectTopic = (id) => {
    stopAudio()
    setTopicId(id)
    setScenarioIdx(0)
    setStepIdx(0)
    setPlaying(false)
    setShowTranscript(false)
  }

  const selectScenario = (idx) => {
    stopAudio()
    setScenarioIdx(idx)
    setStepIdx(0)
    setPlaying(false)
    setShowTranscript(false)
  }

  const togglePlay = () => {
    if (playing) {
      setPlaying(false)
      return
    }
    if (audioPlaying) stopAudio()
    if (stepIdx >= totalSteps - 1) {
      setStepIdx(0)
    }
    setPlaying(true)
  }

  const toggleAudioWalkthrough = () => {
    const el = audioRef.current
    if (!el) return
    if (audioPlaying) {
      el.pause()
      setAudioPlaying(false)
      return
    }
    setPlaying(false)
    if (el.ended || (audioDuration > 0 && el.currentTime >= audioDuration - 0.15)) {
      el.currentTime = 0
      if (syncWithAudio) setStepIdx(0)
    }
    el.play()
      .then(() => setAudioPlaying(true))
      .catch(() => setAudioPlaying(false))
  }

  const handleAudioTimeUpdate = () => {
    const el = audioRef.current
    if (!el) return
    const cur = el.currentTime || 0
    const dur = el.duration || 0
    setAudioTime(cur)
    if (dur > 0 && syncWithAudio && !el.paused) {
      const ratio = Math.min(0.999, Math.max(0, cur / dur))
      const targetIdx = Math.min(totalSteps - 1, Math.floor(ratio * totalSteps))
      setStepIdx((prev) => (prev === targetIdx ? prev : targetIdx))
    }
  }

  const handleAudioSeek = (e) => {
    const el = audioRef.current
    if (!el || !audioDuration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    el.currentTime = pct * audioDuration
    setAudioTime(el.currentTime)
    if (syncWithAudio) {
      setStepIdx(Math.min(totalSteps - 1, Math.floor(pct * totalSteps)))
    }
  }

  const audioProgressPct = audioDuration > 0 ? Math.min(100, (audioTime / audioDuration) * 100) : 0

  return (
    <div className="space-y-5" data-lock-tab-keys="true">
      {/* Hidden static HTMLAudioElement for current scenario walkthrough */}
      {audioMeta && (
        <audio
          key={scenario.id}
          ref={audioRef}
          src={audioMeta.url}
          preload="metadata"
          onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration || 0)}
          onTimeUpdate={handleAudioTimeUpdate}
          onEnded={() => {
            setAudioPlaying(false)
            if (syncWithAudio) setStepIdx(totalSteps - 1)
          }}
        />
      )}

      {/* Topic Picker Strip */}
      <div className="neu-card rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-ink">
              Interactive Code Flow Lab
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted">
              Step through real Python code line by line to see how lists, loops, scopes, and files change in memory.
            </p>
          </div>
          <span className="font-mono text-[11px] text-ink-muted shrink-0">
            Use ← / → keys or Play
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {CODE_FLOW_TOPICS.map((t) => {
            const active = t.id === topic.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTopic(t.id)}
                className={`relative px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5 ${
                  active ? 'text-[var(--primary-text)]' : 'neu-btn text-ink-2'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="flowTopicPill"
                    transition={SPRING_GLIDE}
                    className="absolute inset-0 rounded-xl neu-btn-primary pointer-events-none"
                  />
                )}
                <span className="relative z-10">{t.shortTitle}</span>
                <span className={`relative z-10 font-mono text-[10px] ${active ? 'opacity-75' : 'text-ink-muted'}`}>
                  {t.weekBadge}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active Topic & Scenario Stage */}
      <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={`${topic.id}-${scenario.id}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="neu-card rounded-2xl p-5 sm:p-6 space-y-5"
      >
        {/* Scenario Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b neu-divider">
          <div className="space-y-1.5 max-w-2xl">
            <div className="font-mono text-[11px] text-ink-muted">{topic.weekBadge}</div>
            <h3 className="text-base sm:text-lg font-semibold text-ink leading-snug">
              {topic.title}
            </h3>
            <p className="text-xs sm:text-sm text-ink-2 leading-relaxed">{topic.summary}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {topic.scenarios.length > 1 && (
              <div className="neu-inset p-1 rounded-xl flex flex-wrap items-center gap-1">
                {topic.scenarios.map((sc, idx) => {
                  const active = idx === scenarioIdx
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => selectScenario(idx)}
                      className={`relative px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        active ? 'text-ink' : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId={`scenario-pill-${topic.id}`}
                          transition={SPRING_GLIDE}
                          className="absolute inset-0 rounded-lg neu-card-sm pointer-events-none"
                        />
                      )}
                      <span className="relative z-10">{sc.label}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {onAskTutor && (
              <button
                type="button"
                onClick={() =>
                  onAskTutor(
                    `[Code Flow Lab — ${topic.title} (${scenario.label}), CSCI 1380 beginner Python] Explain why line ${step.line} ("${scenario.code[step.line - 1]?.trim()}") behaves this way in this code:\n${scenario.code.join('\n')}`
                  )
                }
                className="neu-btn inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5" /> Ask Tutor
              </button>
            )}
          </div>
        </div>

        {/* Audio Walkthrough Bar (pre-generated HD neural voice — zero runtime quota!) */}
        {audioMeta && (
          <div className="neu-inset rounded-2xl p-3 sm:p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={toggleAudioWalkthrough}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer shrink-0 ${
                  audioPlaying ? 'neu-btn-primary' : 'neu-btn'
                }`}
              >
                {audioPlaying ? (
                  <>
                    <span className="flex items-end gap-[2px] h-3" aria-hidden="true">
                      {[0, 1, 2].map((b) => (
                        <motion.span
                          key={b}
                          animate={{ height: ['30%', '100%', '40%'] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.55,
                            delay: b * 0.12,
                            ease: 'easeInOut',
                          }}
                          className="w-[2.5px] rounded-full bg-current"
                        />
                      ))}
                    </span>
                    <span>Pause Audio</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Audio Walkthrough</span>
                  </>
                )}
              </motion.button>

              {/* Progress scrubber */}
              <div className="flex-1 min-w-[140px] flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleAudioSeek}
                  aria-label="Seek audio walkthrough"
                  className="flex-1 h-2 rounded-full overflow-hidden cursor-pointer relative"
                  style={{ backgroundColor: 'var(--divider)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-150"
                    style={{
                      width: `${audioProgressPct}%`,
                      backgroundColor: 'var(--accent-bar)',
                    }}
                  />
                </button>
                <span className="font-mono text-[11px] text-ink-muted shrink-0">
                  {formatTime(audioTime)} / {formatTime(audioDuration)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setSyncWithAudio((v) => !v)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition ${
                    syncWithAudio ? 'neu-card-sm text-ink' : 'text-ink-muted hover:text-ink'
                  }`}
                  title="Automatically step through the visual diagram while audio plays"
                >
                  Sync steps: {syncWithAudio ? 'On' : 'Off'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowTranscript((v) => !v)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition ${
                    showTranscript ? 'neu-card-sm text-ink' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Script</span>
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {showTranscript && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="text-xs text-ink-2 leading-relaxed pt-2 border-t neu-divider">
                    {audioMeta.script}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 2-Column Interactive Execution Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT: Code Tracer + Transport + Plain-English Step Explanation */}
          <div className="lg:col-span-6 space-y-4">
            {/* Syntax-highlighted Code Well with Gliding Active Line */}
            <div className="code-well rounded-2xl py-3 px-2 font-mono text-xs sm:text-[13px] leading-relaxed overflow-x-auto max-w-full">
              {scenario.code.map((ln, idx) => {
                const lineNum = idx + 1
                const isActive = step.line === lineNum
                const isSkipped = skippedSet.has(lineNum)
                return (
                  <div
                    key={lineNum}
                    className={`relative flex items-center gap-3 px-2.5 py-1 rounded-lg whitespace-pre ${
                      isSkipped ? 'opacity-35' : ''
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId={`code-line-${scenario.id}`}
                        transition={SPRING_GLIDE}
                        className="absolute inset-0 rounded-lg bg-blue-500/20 pointer-events-none"
                        style={{ boxShadow: 'inset 3px 0 0 var(--accent-bar)' }}
                      />
                    )}
                    <span className="relative z-10 w-5 text-right text-[11px] text-zinc-500 select-none shrink-0">
                      {lineNum}
                    </span>
                    <span className="relative z-10 w-3 text-[10px] select-none shrink-0 flex items-center justify-center">
                      {isActive && (
                        <motion.span
                          layoutId={`code-arrow-${scenario.id}`}
                          transition={SPRING_GLIDE}
                          style={{ color: 'var(--accent-bar)' }}
                        >
                          ▶
                        </motion.span>
                      )}
                    </span>
                    <span className="relative z-10 flex-1">
                      <PythonLine line={ln} />
                    </span>
                    {isSkipped && (
                      <span className="relative z-10 text-[10px] text-zinc-400 italic pr-1 select-none">
                        skipped
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Step Scrubber Bar */}
            <div className="space-y-2.5">
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${totalSteps}, minmax(0, 1fr))` }}
              >
                {scenario.steps.map((_, idx) => {
                  const isCurrent = idx === stepIdx
                  const isPast = idx < stepIdx
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPlaying(false)
                        setStepIdx(idx)
                      }}
                      aria-label={`Jump to step ${idx + 1}`}
                      className="h-2 rounded-full cursor-pointer transition-colors"
                      style={{
                        backgroundColor: isCurrent
                          ? 'var(--accent-bar)'
                          : isPast
                          ? 'var(--text-primary)'
                          : 'var(--divider)',
                      }}
                    />
                  )
                })}
              </div>

              {/* Transport Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      stopAudio()
                      setPlaying(false)
                      setStepIdx(0)
                    }}
                    title="Reset to step 1"
                    aria-label="Reset to step 1"
                    className="neu-btn p-2 rounded-xl cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={stepIdx === 0}
                    onClick={() => {
                      setPlaying(false)
                      setStepIdx((i) => Math.max(0, i - 1))
                    }}
                    aria-label="Previous step"
                    className="neu-btn inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="neu-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    {playing ? (
                      <>
                        <Pause className="w-3.5 h-3.5" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" /> {stepIdx >= totalSteps - 1 ? 'Replay' : 'Play'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={stepIdx >= totalSteps - 1}
                    onClick={() => {
                      setPlaying(false)
                      setStepIdx((i) => Math.min(totalSteps - 1, i + 1))
                    }}
                    aria-label="Next step"
                    className="neu-btn inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSpeed((s) => (s === 1 ? 1.5 : 1))}
                    className="neu-btn px-2.5 py-1.5 rounded-xl font-mono text-[11px] font-semibold cursor-pointer"
                  >
                    {speed}x
                  </button>
                  <span className="font-mono text-xs text-ink-muted">
                    Step {stepIdx + 1} / {totalSteps}
                  </span>
                </div>
              </div>
            </div>

            {/* What Happens On This Line */}
            <div className="neu-inset rounded-2xl p-4 space-y-2">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${scenario.id}-${stepIdx}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-ink-muted">
                      Line {step.line} · What Python does
                    </span>
                    <span className="neu-card-sm px-2.5 py-0.5 rounded-lg text-[11px] font-semibold text-ink">
                      {step.op}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-ink leading-relaxed">{step.note}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT: Live Visual Diagrams, Memory State & Console Output */}
          <div className="lg:col-span-6 space-y-4">
            {/* Subtle semantic visual legend */}
            <div className="flex flex-wrap items-center gap-4 px-1 text-[11px] text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: 'var(--accent-bar)' }}
                />
                <span>Index / Execution pointer</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block bg-emerald-500" />
                <span>Value updated in memory</span>
              </span>
            </div>

            {step.listRibbon && (
              <ListRibbonVisual ribbon={step.listRibbon} scenarioId={scenario.id} />
            )}
            {step.rangeTrack && (
              <RangeTrackVisual track={step.rangeTrack} scenarioId={scenario.id} />
            )}
            {step.condition && <ConditionGateVisual condition={step.condition} />}
            {step.grid2d && <Grid2DVisual grid={step.grid2d} scenarioId={scenario.id} />}
            {step.loopTrack && (
              <LoopTrackVisual track={step.loopTrack} scenarioId={scenario.id} />
            )}
            {step.frames && <ScopeFramesVisual frames={step.frames} />}
            {step.fileState && <FileStateVisual fileState={step.fileState} />}
            {step.dictMap && <DictMapVisual dictMap={step.dictMap} />}
            {step.setBag && <SetBagVisual setBag={step.setBag} />}

            {/* Variables in Memory (Emerald for value updates + inline old -> new diff!) */}
            {step.vars && step.vars.length > 0 && !step.frames && (
              <div className="neu-inset rounded-2xl p-4 space-y-2.5">
                <div className="text-xs font-semibold text-ink">Variables in Memory</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {step.vars.map((v) => {
                    const prevVal = prevVarsMap.get(v.name)
                    const hasDiff = v.changed && prevVal !== undefined && prevVal !== v.value
                    const isNew = v.changed && prevVal === undefined
                    const isWide =
                      String(v.value).length > 14 ||
                      (hasDiff && String(prevVal).length + String(v.value).length > 12)
                    return (
                      <div
                        key={v.name}
                        className={`neu-card-sm rounded-xl px-3 py-2 flex items-center justify-between gap-3 text-xs font-mono transition-shadow ${
                          isWide ? 'sm:col-span-2' : ''
                        }`}
                        style={
                          v.changed
                            ? { boxShadow: '0 0 0 1.5px rgba(16, 185, 129, 0.7)' }
                            : undefined
                        }
                      >
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-semibold text-ink">{v.name}</span>
                          <span className="text-[10px] text-ink-muted">({v.type})</span>
                          {isNew && (
                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-semibold bg-emerald-600/15 text-emerald-700 dark:text-emerald-300">
                              new
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0 justify-end">
                          {hasDiff && (
                            <span className="text-[11px] text-ink-muted line-through opacity-70 truncate">
                              {prevVal}
                            </span>
                          )}
                          {hasDiff && (
                            <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">
                              →
                            </span>
                          )}
                          <RollingValue
                            value={v.value}
                            className={`truncate ${
                              v.changed
                                ? 'font-semibold text-emerald-700 dark:text-emerald-300'
                                : 'text-ink-2'
                            }`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Live Console Output */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-ink">Console Output</div>
              <div className="code-well rounded-2xl px-4 py-3 font-mono text-xs leading-relaxed min-h-[76px] space-y-1">
                {step.output.length === 0 ? (
                  <div className="text-zinc-500 italic">(no print output yet)</div>
                ) : (
                  step.output.map((ln, idx) => (
                    <motion.div
                      key={`${idx}-${ln}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-emerald-300 whitespace-pre"
                    >
                      {ln}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      </AnimatePresence>
    </div>
  )
}
