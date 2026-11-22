import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, Check, X, RotateCcw, Mic, Play
} from 'lucide-react'
import {
  EXAM_STORAGE_KEY,
  EXAM_WEEKS,
  EXAM_QUESTIONS,
  getQuestionsForWeek,
  getMockExamQuestions,
} from '../../data/finalExamData'
import PythonLine from '../PythonLine'
import WeekInteractiveLab from './WeekInteractiveLab'

const LETTERS = ['A', 'B', 'C', 'D']

const EMPTY_PROGRESS = {
  practiceAnswers: {}, // { [qId]: chosenOptionIndex }
  completedLabs: {},   // { [weekNum]: true }
  lastWeek: 1,
  bestMockScore: null, // { correct, total }
}

function loadProgress() {
  if (typeof window === 'undefined') return EMPTY_PROGRESS
  try {
    const raw = localStorage.getItem(EXAM_STORAGE_KEY)
    if (!raw) return EMPTY_PROGRESS
    const parsed = JSON.parse(raw)
    return {
      practiceAnswers: parsed.practiceAnswers || {},
      completedLabs: parsed.completedLabs || {},
      lastWeek: parsed.lastWeek || 1,
      bestMockScore: parsed.bestMockScore || null,
    }
  } catch {
    return EMPTY_PROGRESS
  }
}

export default function FinalExamReview({ onAskTutor, onOpenProjectTab }) {
  const [progress, setProgress] = useState(loadProgress)
  const [mode, setMode] = useState('overview') // 'overview' | 'practice' | 'mock' | 'retry'
  const [selectedWeek, setSelectedWeek] = useState(() => progress.lastWeek || 1)
  const [practiceQIdx, setPracticeQIdx] = useState(0)

  // Mock Exam state (strict: no hints, no solutions until submitted)
  const mockQuestions = getMockExamQuestions()
  const [mockIdx, setMockIdx] = useState(0)
  const [mockAnswers, setMockAnswers] = useState({})
  const [mockSubmitted, setMockSubmitted] = useState(false)

  // Retry Missed Questions state
  const [retryIds, setRetryIds] = useState([])
  const [retryIdx, setRetryIdx] = useState(0)
  const [retryAnswers, setRetryAnswers] = useState({})

  useEffect(() => {
    try {
      localStorage.setItem(EXAM_STORAGE_KEY, JSON.stringify(progress))
    } catch {
      // ignore quota errors
    }
  }, [progress])

  const totalUniqueQuestions = EXAM_QUESTIONS.length
  const masteredCount = EXAM_QUESTIONS.reduce(
    (acc, q) => acc + (progress.practiceAnswers[q.id] === q.answer ? 1 : 0),
    0
  )
  const completedWeeksCount = EXAM_WEEKS.filter((w) => {
    const qs = getQuestionsForWeek(w.week)
    const allRight = qs.every((q) => progress.practiceAnswers[q.id] === q.answer)
    return allRight || Boolean(progress.completedLabs[w.week])
  }).length

  const scrollToTop = () => {
    if (typeof window === 'undefined') return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }

  const startWeekPractice = (weekNum) => {
    setSelectedWeek(weekNum)
    setPracticeQIdx(0)
    setProgress((p) => ({ ...p, lastWeek: weekNum }))
    setMode('practice')
    scrollToTop()
  }

  const handleLabComplete = (weekNum) => {
    setProgress((p) => {
      if (p.completedLabs[weekNum]) return p
      return { ...p, completedLabs: { ...p.completedLabs, [weekNum]: true } }
    })
  }

  const handlePracticeAnswer = (qId, optIdx) => {
    setProgress((p) => ({
      ...p,
      practiceAnswers: { ...p.practiceAnswers, [qId]: optIdx },
    }))
  }

  const startMockExam = () => {
    setMockIdx(0)
    setMockAnswers({})
    setMockSubmitted(false)
    setMode('mock')
    scrollToTop()
  }

  const submitMockExam = () => {
    setMockSubmitted(true)
    scrollToTop()
    const correct = mockQuestions.reduce(
      (acc, q) => acc + (mockAnswers[q.id] === q.answer ? 1 : 0),
      0
    )
    setProgress((p) => {
      const prevBest = p.bestMockScore?.correct ?? -1
      if (correct >= prevBest) {
        return { ...p, bestMockScore: { correct, total: mockQuestions.length } }
      }
      return p
    })
  }

  const startRetryMissed = () => {
    const missed = mockQuestions
      .filter((q) => mockAnswers[q.id] !== q.answer)
      .map((q) => q.id)
    if (missed.length === 0) return
    setRetryIds(missed)
    setRetryIdx(0)
    setRetryAnswers({})
    setMode('retry')
    scrollToTop()
  }

  const resetAllProgress = () => {
    setProgress(EMPTY_PROGRESS)
    setSelectedWeek(1)
    setPracticeQIdx(0)
    setMockAnswers({})
    setMockSubmitted(false)
    setRetryIds([])
    setRetryAnswers({})
    try {
      localStorage.removeItem(EXAM_STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  const weekObj = EXAM_WEEKS.find((w) => w.week === selectedWeek) || EXAM_WEEKS[0]
  const weekQuestions = getQuestionsForWeek(selectedWeek)
  const activePracticeQ = weekQuestions[practiceQIdx] || weekQuestions[0]
  const practicePick = activePracticeQ ? progress.practiceAnswers[activePracticeQ.id] : undefined
  const practiceAnswered = practicePick !== undefined
  const practiceCorrect = activePracticeQ && practicePick === activePracticeQ.answer

  const retryQuestions = retryIds
    .map((id) => EXAM_QUESTIONS.find((q) => q.id === id))
    .filter(Boolean)
  const activeRetryQ = retryQuestions[retryIdx]

  return (
    <div
      className="space-y-6"
      data-lock-tab-keys={mode !== 'overview' ? 'true' : undefined}
    >
      {/* ==================== OVERVIEW LANDING ==================== */}
      {mode === 'overview' && (
        <div className="space-y-6">
          <div className="neu-card rounded-2xl p-6 sm:p-7 space-y-5">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <h2 className="text-2xl font-semibold tracking-tight text-ink">
                  Final Exam Review · CSCI 1380
                </h2>
                <p className="text-sm text-ink-2 leading-relaxed">
                  Practice Intro to Python topics from Weeks 1–12—variables, files, conditionals, loops, functions, data structures, and modular design—through interactive exercises and a mixed mock exam.
                </p>
                <p className="text-xs text-ink-muted">
                  Practice guide based on Weekly Material (Weeks 1–12). Does not predict the actual final exam; works offline without Gemini or a mic.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => startWeekPractice(progress.lastWeek || 1)}
                  className="neu-btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>
                    {masteredCount > 0
                      ? `Continue Week ${progress.lastWeek || 1}`
                      : 'Start Practice (Week 1)'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={startMockExam}
                  className="neu-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  Mixed Mock Exam ({mockQuestions.length})
                </button>
              </div>
            </div>

            {/* Progress Bar & Persistence Explanation */}
            <div className="pt-4 border-t neu-divider space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-4 font-mono">
                  <span className="text-ink font-semibold">
                    Mastered: {masteredCount} / {totalUniqueQuestions} questions
                  </span>
                  <span className="text-ink-muted">
                    Weeks practiced: {completedWeeksCount} / 12
                  </span>
                  {progress.bestMockScore && (
                    <span className="text-ink-muted">
                      Best mock: {progress.bestMockScore.correct}/{progress.bestMockScore.total}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={resetAllProgress}
                  className="neu-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset progress
                </button>
              </div>

              <div className="neu-inset h-2 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${Math.round((masteredCount / totalUniqueQuestions) * 100)}%`,
                    backgroundColor: 'var(--text-primary)',
                  }}
                  className="h-full rounded-full transition-all duration-300"
                />
              </div>

              <p className="text-[11.5px] text-ink-muted">
                Progress saves automatically in this browser and resets only when you click <strong>Reset progress</strong> or clear site data.
              </p>
            </div>
          </div>

          {/* 12-Week Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-ink">Choose a Week (1–12)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {EXAM_WEEKS.map((w) => {
                const qs = getQuestionsForWeek(w.week)
                const rightInWeek = qs.filter(
                  (q) => progress.practiceAnswers[q.id] === q.answer
                ).length
                const labDone = Boolean(progress.completedLabs[w.week])
                const allDone = rightInWeek === qs.length && (w.week === 8 || labDone)

                return (
                  <button
                    key={w.week}
                    type="button"
                    onClick={() => startWeekPractice(w.week)}
                    className="neu-btn text-left rounded-2xl p-4 flex flex-col justify-between gap-3 cursor-pointer"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-semibold text-ink-muted">
                          Week {w.week}
                        </span>
                        <span className="font-mono text-[11px] text-ink-muted inline-flex items-center gap-1">
                          {allDone && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                          {rightInWeek}/{qs.length} Qs
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-ink leading-snug">
                        {w.shortTitle}
                      </div>
                      <p className="text-xs text-ink-muted leading-relaxed">
                        {w.summary}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {w.topics.map((t) => (
                        <span
                          key={t}
                          className="neu-inset px-2 py-0.5 rounded-md text-[10.5px] text-ink-2"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== WEEKLY PRACTICE MODE ==================== */}
      {mode === 'practice' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => { setMode('overview'); scrollToTop() }}
              className="neu-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> All Weeks
            </button>

            <div className="neu-inset p-1 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full">
              {EXAM_WEEKS.map((w) => {
                const active = w.week === selectedWeek
                return (
                  <button
                    key={w.week}
                    type="button"
                    onClick={() => startWeekPractice(w.week)}
                    className={`px-2.5 py-1.5 rounded-xl font-mono text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
                      active ? 'neu-btn-primary' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    W{w.week}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Week Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="font-mono text-xs text-ink-muted">Week {weekObj.week} of 12</div>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-ink">
                {weekObj.title}
              </h2>
            </div>

            {onAskTutor && (
              <button
                type="button"
                onClick={() =>
                  onAskTutor(
                    `[Final Exam Review Practice — Week ${weekObj.week}: ${weekObj.title}, CSCI 1380 beginner level] Give me a brief 3-sentence review of "${weekObj.title}" with one simple example.`
                  )
                }
                className="neu-btn inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer self-start sm:self-auto"
              >
                <Mic className="w-3.5 h-3.5" /> Ask Tutor
              </button>
            )}
          </div>

          {/* Interactive Micro-Lab */}
          <div className="neu-card rounded-2xl p-5 sm:p-6 space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Interactive Activity
            </div>
            <WeekInteractiveLab
              key={weekObj.week}
              labType={weekObj.labType}
              progress={progress}
              onComplete={() => handleLabComplete(weekObj.week)}
              onJumpWeek={(w) => startWeekPractice(w)}
              onOpenProjectTab={onOpenProjectTab}
            />
          </div>

          {/* One-at-a-Time Practice Question */}
          {activePracticeQ && (
            <div className="neu-card rounded-2xl p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="neu-inset px-2.5 py-1 rounded-lg text-[11px] font-semibold text-ink-2">
                  {activePracticeQ.topic}
                </span>
                <span className="font-mono text-xs text-ink-muted">
                  Question {practiceQIdx + 1} of {weekQuestions.length}
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activePracticeQ.id}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <h3 className="text-base sm:text-lg font-semibold text-ink leading-snug">
                    {activePracticeQ.prompt}
                  </h3>

                  {activePracticeQ.code && (
                    <div className="code-well rounded-xl px-4 py-3 font-mono text-xs leading-relaxed overflow-x-auto max-w-full">
                      {activePracticeQ.code.split('\n').map((ln, idx) => (
                        <div key={idx} className="whitespace-pre">
                          <PythonLine line={ln} />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {activePracticeQ.options.map((opt, oIdx) => {
                      const chosen = practicePick === oIdx
                      const revealRight = practiceAnswered && oIdx === activePracticeQ.answer
                      const revealWrong = chosen && oIdx !== activePracticeQ.answer
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handlePracticeAnswer(activePracticeQ.id, oIdx)}
                          className={`w-full text-left px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-between gap-3 ${
                            revealRight
                              ? 'state-ok font-semibold'
                              : revealWrong
                              ? 'state-err'
                              : 'neu-btn'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-lg font-mono text-xs font-semibold inline-flex items-center justify-center shrink-0 ${
                                revealRight
                                  ? 'bg-emerald-600 text-white'
                                  : revealWrong
                                  ? 'bg-rose-600 text-white'
                                  : 'neu-inset text-ink-2'
                              }`}
                            >
                              {LETTERS[oIdx]}
                            </span>
                            <span className="leading-snug">{opt}</span>
                          </div>
                          {revealRight && <Check className="w-4 h-4 shrink-0" />}
                          {revealWrong && <X className="w-4 h-4 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>

                  {practiceAnswered && (
                    <div className={`rounded-xl p-4 text-xs sm:text-sm space-y-1.5 ${practiceCorrect ? 'state-ok' : 'state-err'}`}>
                      <div className="font-semibold">
                        {practiceCorrect
                          ? 'Correct'
                          : `Correct answer: ${LETTERS[activePracticeQ.answer]}) ${activePracticeQ.options[activePracticeQ.answer]}`}
                      </div>
                      <p className="leading-relaxed">
                        <strong>Explanation:</strong> {activePracticeQ.explain}
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Inline Question Controls */}
              {weekQuestions.length > 1 && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    disabled={practiceQIdx === 0}
                    onClick={() => setPracticeQIdx((i) => Math.max(0, i - 1))}
                    className="neu-btn px-3.5 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    Previous Question
                  </button>
                  <button
                    type="button"
                    disabled={practiceQIdx >= weekQuestions.length - 1}
                    onClick={() => setPracticeQIdx((i) => Math.min(weekQuestions.length - 1, i + 1))}
                    className="neu-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    Next Question <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Week Navigation Footer */}
              <div className="pt-4 border-t neu-divider flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={selectedWeek === 1}
                  onClick={() => startWeekPractice(Math.max(1, selectedWeek - 1))}
                  className="neu-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Week {Math.max(1, selectedWeek - 1)}
                </button>
                {selectedWeek < 12 ? (
                  <button
                    type="button"
                    onClick={() => startWeekPractice(selectedWeek + 1)}
                    className="neu-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Next: Week {selectedWeek + 1} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startMockExam}
                    className="neu-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Take Mixed Mock Exam <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== STRICT MIXED MOCK EXAM ==================== */}
      {mode === 'mock' && (
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => { setMode('overview'); scrollToTop() }}
              className="neu-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Exit Mock Exam
            </button>

            <span className="font-mono text-xs text-ink-muted">
              {mockSubmitted
                ? 'Exam submitted · Review mode'
                : `Answered ${Object.keys(mockAnswers).length} / ${mockQuestions.length} · No hints during exam`}
            </span>
          </div>

          {!mockSubmitted ? (
            <>
              {/* Progress Bar */}
              <div className="neu-card rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-ink font-semibold">
                    Mock Question {mockIdx + 1} of {mockQuestions.length}
                  </span>
                  <span className="text-ink-muted">Week {mockQuestions[mockIdx].week}</span>
                </div>
                <div className="grid grid-cols-9 sm:grid-cols-[repeat(18,minmax(0,1fr))] gap-1">
                  {mockQuestions.map((q, idx) => {
                    const isAnswered = mockAnswers[q.id] !== undefined
                    const isCurrent = idx === mockIdx
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setMockIdx(idx)}
                        aria-label={`Go to mock question ${idx + 1}`}
                        style={{
                          backgroundColor: isCurrent
                            ? 'var(--accent-bar)'
                            : isAnswered
                            ? 'var(--text-primary)'
                            : 'var(--divider)',
                        }}
                        className="h-2 rounded-full cursor-pointer transition-colors"
                      />
                    )
                  })}
                </div>
              </div>

              {/* Active Mock Question Card (NO solutions, NO hints, NO tutor) */}
              <div className="neu-card rounded-2xl p-6 space-y-5">
                <h3 className="text-base sm:text-lg font-semibold text-ink leading-snug">
                  {mockQuestions[mockIdx].prompt}
                </h3>

                {mockQuestions[mockIdx].code && (
                  <div className="code-well rounded-xl px-4 py-3 font-mono text-xs leading-relaxed overflow-x-auto max-w-full">
                    {mockQuestions[mockIdx].code.split('\n').map((ln, idx) => (
                      <div key={idx} className="whitespace-pre">
                        <PythonLine line={ln} />
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2.5">
                  {mockQuestions[mockIdx].options.map((opt, oIdx) => {
                    const isSelected = mockAnswers[mockQuestions[mockIdx].id] === oIdx
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() =>
                          setMockAnswers((prev) => ({
                            ...prev,
                            [mockQuestions[mockIdx].id]: oIdx,
                          }))
                        }
                        className={`w-full text-left px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer flex items-center gap-3 ${
                          isSelected ? 'neu-btn-primary font-semibold' : 'neu-btn'
                        }`}
                      >
                        <span className="font-mono text-xs opacity-75">{LETTERS[oIdx]}.</span>
                        <span className="leading-snug">{opt}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="pt-3 border-t neu-divider flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={mockIdx === 0}
                    onClick={() => setMockIdx((i) => Math.max(0, i - 1))}
                    className="neu-btn px-3.5 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {mockIdx < mockQuestions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setMockIdx((i) => i + 1)}
                        className="neu-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Next <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={submitMockExam}
                        className="neu-btn-primary px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer"
                      >
                        Submit Mock Exam
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Mock Exam Results & Answer Review */
            <div className="space-y-5">
              {(() => {
                const score = mockQuestions.reduce(
                  (acc, q) => acc + (mockAnswers[q.id] === q.answer ? 1 : 0),
                  0
                )
                const missedCount = mockQuestions.length - score
                const pct = Math.round((score / mockQuestions.length) * 100)

                return (
                  <>
                    <div className="neu-card rounded-2xl p-7 text-center space-y-4">
                      <div className="text-4xl font-mono font-semibold text-ink">
                        {score} / {mockQuestions.length}{' '}
                        <span className="text-xl text-ink-muted">({pct}%)</span>
                      </div>
                      <p className="text-sm text-ink-2">
                        {missedCount === 0
                          ? 'Clean sweep across all 12 weeks!'
                          : `You missed ${missedCount} question${missedCount === 1 ? '' : 's'}. Review the explanations below or retry just your missed questions.`}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                        {missedCount > 0 && (
                          <button
                            type="button"
                            onClick={startRetryMissed}
                            className="neu-btn-primary px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            Practice Missed Questions ({missedCount})
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={startMockExam}
                          className="neu-btn inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Retake Mock Exam
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-ink">Full Answer Review</h3>
                      {mockQuestions.map((q, idx) => {
                        const pick = mockAnswers[q.id]
                        const right = pick === q.answer
                        return (
                          <div key={q.id} className="neu-card rounded-2xl p-4 space-y-2 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-ink-muted">
                                Q{idx + 1} · Week {q.week} ({q.topic})
                              </span>
                              <span className={`px-2 py-0.5 rounded-md font-semibold ${right ? 'state-ok' : 'state-err'}`}>
                                {right ? 'Correct' : pick === undefined ? 'Unanswered' : 'Incorrect'}
                              </span>
                            </div>
                            <div className="text-sm font-semibold text-ink">{q.prompt}</div>
                            {!right && (
                              <div className="text-ink-2">
                                Your answer:{' '}
                                <span className="font-medium">
                                  {pick === undefined ? 'None' : q.options[pick]}
                                </span>
                              </div>
                            )}
                            <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                              Correct answer: {q.options[q.answer]}
                            </div>
                            <div className="text-ink-2 leading-relaxed">{q.explain}</div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* ==================== RETRY MISSED QUESTIONS ==================== */}
      {mode === 'retry' && activeRetryQ && (
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMode('mock')}
              className="neu-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Results
            </button>
            <span className="font-mono text-xs text-ink-muted">
              Missed Review {retryIdx + 1} of {retryQuestions.length}
            </span>
          </div>

          <div className="neu-card rounded-2xl p-6 space-y-5">
            <div className="font-mono text-xs text-ink-muted">
              Week {activeRetryQ.week} · {activeRetryQ.topic}
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-ink">{activeRetryQ.prompt}</h3>

            {activeRetryQ.code && (
              <div className="code-well rounded-xl px-4 py-3 font-mono text-xs leading-relaxed overflow-x-auto max-w-full">
                {activeRetryQ.code.split('\n').map((ln, idx) => (
                  <div key={idx} className="whitespace-pre">
                    <PythonLine line={ln} />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2.5">
              {activeRetryQ.options.map((opt, oIdx) => {
                const pick = retryAnswers[activeRetryQ.id]
                const answered = pick !== undefined
                const revealRight = answered && oIdx === activeRetryQ.answer
                const revealWrong = pick === oIdx && oIdx !== activeRetryQ.answer
                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() =>
                      setRetryAnswers((prev) => ({ ...prev, [activeRetryQ.id]: oIdx }))
                    }
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-between gap-2 ${
                      revealRight ? 'state-ok font-semibold' : revealWrong ? 'state-err' : 'neu-btn'
                    }`}
                  >
                    <span>
                      {LETTERS[oIdx]}. {opt}
                    </span>
                    {revealRight && <Check className="w-4 h-4 shrink-0" />}
                    {revealWrong && <X className="w-4 h-4 shrink-0" />}
                  </button>
                )
              })}
            </div>

            {retryAnswers[activeRetryQ.id] !== undefined && (
              <div
                className={`rounded-xl p-4 text-xs sm:text-sm ${
                  retryAnswers[activeRetryQ.id] === activeRetryQ.answer ? 'state-ok' : 'state-err'
                }`}
              >
                <strong>Explanation:</strong> {activeRetryQ.explain}
              </div>
            )}

            <div className="pt-3 border-t neu-divider flex items-center justify-between">
              <button
                type="button"
                disabled={retryIdx === 0}
                onClick={() => setRetryIdx((i) => Math.max(0, i - 1))}
                className="neu-btn px-3.5 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              {retryIdx < retryQuestions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setRetryIdx((i) => i + 1)}
                  className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Next missed question
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setMode('overview'); scrollToTop() }}
                  className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Finish review
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
