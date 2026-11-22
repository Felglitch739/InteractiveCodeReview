import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { CODE_FLOW_TOPICS } from '../../data/codeFlowData'
import PythonLine from '../PythonLine'

function ListRibbonVisual({ ribbon }) {
  const count = ribbon.items.length
  const [sliceStart, sliceEnd] = ribbon.sliceRange || [-1, -1]

  return (
    <div className="neu-inset rounded-2xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-mono font-semibold text-ink">{ribbon.name}</span>
        <span className="font-mono text-[11px] text-ink-muted">len = {count}</span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex items-stretch gap-2.5 min-w-max">
          <AnimatePresence mode="popLayout">
            {ribbon.items.map((item, idx) => {
              const negIdx = idx - count
              const isActive = ribbon.activeIdx === idx
              const isMutated = ribbon.mutatedIdx === idx
              const inSlice = sliceStart >= 0 && idx >= sliceStart && idx < sliceEnd

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="flex flex-col items-center gap-1 min-w-[74px]"
                >
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

                  {/* Value Cell */}
                  <div
                    className={`w-full px-3 py-2.5 rounded-xl font-mono text-xs sm:text-[13px] font-semibold text-center transition-all ${
                      isActive || isMutated || inSlice ? 'neu-card-sm text-ink' : 'neu-btn text-ink-2'
                    }`}
                    style={
                      isActive
                        ? { boxShadow: '0 0 0 2px var(--accent-bar)' }
                        : isMutated
                        ? { boxShadow: '0 0 0 2px #10b981' }
                        : inSlice
                        ? { boxShadow: '0 0 0 2px var(--accent-bar)' }
                        : undefined
                    }
                  >
                    {item.value}
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

                  {/* Active pointer arrow */}
                  <div className="h-3.5 flex items-center justify-center">
                    {isActive && (
                      <ArrowUp
                        className="w-3.5 h-3.5"
                        style={{ color: 'var(--accent-bar)' }}
                      />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {ribbon.sliceRange && (
        <div className="text-[11.5px] text-ink-2 font-mono">
          Slice [{sliceStart}:{sliceEnd}] → index {sliceStart} included, index {sliceEnd} excluded
        </div>
      )}

      {ribbon.removedNote && (
        <div className="text-[11.5px] text-ink-2">{ribbon.removedNote}</div>
      )}
    </div>
  )
}

function RangeTrackVisual({ track }) {
  return (
    <div className="neu-inset rounded-2xl p-3.5 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono font-semibold text-ink">{track.expr}</span>
        <span className="text-[11px] text-ink-muted">Loop sequence</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {track.values.map((val, idx) => {
          const isCurrent = idx === track.activeIdx
          const isDone = track.activeIdx > idx
          return (
            <div
              key={val}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold inline-flex items-center gap-1.5 transition-all ${
                isCurrent
                  ? 'neu-btn-primary'
                  : isDone
                  ? 'state-ok'
                  : 'neu-btn text-ink-muted'
              }`}
            >
              {isDone && <Check className="w-3 h-3" />}
              <span>i = {val}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ConditionGateVisual({ condition }) {
  return (
    <div
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
    </div>
  )
}

function Grid2DVisual({ grid }) {
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
                <div
                  key={`${r}-${c}`}
                  className={`rounded-xl py-2.5 px-2 text-center font-mono text-xs font-semibold transition-all ${
                    isActive
                      ? 'neu-btn-primary'
                      : isVisited
                      ? 'state-ok'
                      : 'neu-btn text-ink-muted'
                  }`}
                >
                  ({r}, {c})
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function LoopTrackVisual({ track }) {
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
      <div className="grid grid-cols-5 gap-2">
        {track.items.map((item) => {
          const styleClass =
            item.status === 'active'
              ? 'neu-btn-primary'
              : item.status === 'printed'
              ? 'state-ok'
              : item.status === 'stopped'
              ? 'state-err'
              : item.status === 'skipped'
              ? 'neu-card-sm text-amber-700 dark:text-amber-300'
              : 'neu-btn text-ink-muted opacity-65'
          return (
            <div
              key={item.val}
              className={`rounded-xl p-2 text-center transition-all ${styleClass}`}
            >
              <div className="font-mono text-sm font-semibold">{item.val}</div>
              <div className="text-[10px] font-medium mt-0.5 truncate">
                {labelMap[item.status]}
              </div>
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
              style={v.changed ? { boxShadow: '0 0 0 2px var(--accent-bar)' } : undefined}
            >
              <span className="text-ink-muted">{v.name}</span>
              <span className="font-semibold text-ink truncate">{v.value}</span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {frames.local ? (
          <motion.div
            key="local-open"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
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
                    style={v.changed ? { boxShadow: '0 0 0 2px var(--accent-bar)' } : undefined}
                  >
                    <span className="text-ink-muted">{v.name}</span>
                    <span className="font-semibold text-ink truncate">{v.value}</span>
                  </div>
                ))}
              </div>
            )}

            {frames.local.returning && (
              <div className="state-ok rounded-xl px-3 py-1.5 font-mono text-xs font-semibold">
                return → {frames.local.returning}
              </div>
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
              <div
                key={`${idx}-${ln}`}
                className={`flex items-center gap-2.5 px-1.5 py-0.5 rounded ${
                  isNewest || fileState.reading ? 'bg-blue-500/15 text-blue-200' : 'text-zinc-200'
                }`}
              >
                <span className="text-zinc-500 select-none">{idx + 1}</span>
                <span>{ln}</span>
              </div>
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
          <div
            key={e.key}
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
            <span>{e.value}</span>
          </div>
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

  const [stepIdx, setStepIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1) // 1 or 1.5

  const step = scenario.steps[stepIdx] || scenario.steps[0]
  const totalSteps = scenario.steps.length
  const skippedSet = new Set(step.skippedLines || [])

  // Sync if parent jumps to a specific topic
  useEffect(() => {
    if (initialTopicId && CODE_FLOW_TOPICS.some((t) => t.id === initialTopicId)) {
      setTopicId(initialTopicId)
      setScenarioIdx(0)
      setStepIdx(0)
      setPlaying(false)
    }
  }, [initialTopicId])

  // Autoplay timer
  useEffect(() => {
    if (!playing) return
    if (stepIdx >= totalSteps - 1) {
      setPlaying(false)
      return
    }
    const delay = speed === 1.5 ? 1050 : 1650
    const timer = setTimeout(() => {
      setStepIdx((i) => Math.min(totalSteps - 1, i + 1))
    }, delay)
    return () => clearTimeout(timer)
  }, [playing, stepIdx, totalSteps, speed])

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
    setTopicId(id)
    setScenarioIdx(0)
    setStepIdx(0)
    setPlaying(false)
  }

  const selectScenario = (idx) => {
    setScenarioIdx(idx)
    setStepIdx(0)
    setPlaying(false)
  }

  const togglePlay = () => {
    if (playing) {
      setPlaying(false)
      return
    }
    if (stepIdx >= totalSteps - 1) {
      setStepIdx(0)
    }
    setPlaying(true)
  }

  return (
    <div className="space-y-5" data-lock-tab-keys="true">
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
                className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all inline-flex items-center gap-1.5 ${
                  active ? 'neu-btn-primary' : 'neu-btn text-ink-2'
                }`}
              >
                <span>{t.shortTitle}</span>
                <span className={`font-mono text-[10px] ${active ? 'opacity-75' : 'text-ink-muted'}`}>
                  {t.weekBadge}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active Topic & Scenario Stage */}
      <div className="neu-card rounded-2xl p-5 sm:p-6 space-y-5">
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
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                        active ? 'neu-card-sm text-ink' : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      {sc.label}
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

        {/* 2-Column Interactive Execution Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT: Code Tracer + Transport + Plain-English Step Explanation */}
          <div className="lg:col-span-6 space-y-4">
            {/* Syntax-highlighted Code Well */}
            <div className="code-well rounded-2xl py-3 px-2 font-mono text-xs sm:text-[13px] leading-relaxed overflow-x-auto max-w-full">
              {scenario.code.map((ln, idx) => {
                const lineNum = idx + 1
                const isActive = step.line === lineNum
                const isSkipped = skippedSet.has(lineNum)
                return (
                  <div
                    key={lineNum}
                    className={`flex items-center gap-3 px-2.5 py-1 rounded-lg transition-colors whitespace-pre ${
                      isActive
                        ? 'bg-blue-500/20 text-white'
                        : isSkipped
                        ? 'opacity-35'
                        : ''
                    }`}
                    style={
                      isActive
                        ? { boxShadow: 'inset 3px 0 0 var(--accent-bar)' }
                        : undefined
                    }
                  >
                    <span className="w-5 text-right text-[11px] text-zinc-500 select-none shrink-0">
                      {lineNum}
                    </span>
                    <span className="w-3 text-[10px] select-none shrink-0" style={{ color: 'var(--accent-bar)' }}>
                      {isActive ? '▶' : ''}
                    </span>
                    <span className="flex-1">
                      <PythonLine line={ln} />
                    </span>
                    {isSkipped && (
                      <span className="text-[10px] text-zinc-400 italic pr-1 select-none">
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
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-semibold text-ink-muted">
                  Line {step.line} · What Python does
                </span>
                <span className="neu-card-sm px-2.5 py-0.5 rounded-lg text-[11px] font-semibold text-ink">
                  {step.op}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-ink leading-relaxed">{step.note}</p>
            </div>
          </div>

          {/* RIGHT: Live Visual Diagrams, Memory State & Console Output */}
          <div className="lg:col-span-6 space-y-4">
            {step.listRibbon && <ListRibbonVisual ribbon={step.listRibbon} />}
            {step.rangeTrack && <RangeTrackVisual track={step.rangeTrack} />}
            {step.condition && <ConditionGateVisual condition={step.condition} />}
            {step.grid2d && <Grid2DVisual grid={step.grid2d} />}
            {step.loopTrack && <LoopTrackVisual track={step.loopTrack} />}
            {step.frames && <ScopeFramesVisual frames={step.frames} />}
            {step.fileState && <FileStateVisual fileState={step.fileState} />}
            {step.dictMap && <DictMapVisual dictMap={step.dictMap} />}
            {step.setBag && <SetBagVisual setBag={step.setBag} />}

            {/* Variables in Memory (when not already shown via Scope Frames) */}
            {step.vars && step.vars.length > 0 && !step.frames && (
              <div className="neu-inset rounded-2xl p-4 space-y-2.5">
                <div className="text-xs font-semibold text-ink">Variables in Memory</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {step.vars.map((v) => {
                    const isWide = String(v.value).length > 14
                    return (
                      <div
                        key={v.name}
                        className={`neu-card-sm rounded-xl px-3 py-2 flex items-center justify-between gap-3 text-xs font-mono ${
                          isWide ? 'sm:col-span-2' : ''
                        }`}
                        style={v.changed ? { boxShadow: '0 0 0 2px var(--accent-bar)' } : undefined}
                      >
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-semibold text-ink">{v.name}</span>
                          <span className="text-[10px] text-ink-muted">({v.type})</span>
                        </div>
                        <span className="text-ink-2 truncate text-right">{v.value}</span>
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
                    <div key={`${idx}-${ln}`} className="text-emerald-300 whitespace-pre">
                      {ln}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
