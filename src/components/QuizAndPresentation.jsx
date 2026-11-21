import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, CheckCircle2, XCircle, Mic, Users, HelpCircle,
  RotateCcw, Flame, ArrowRight, LayoutGrid, ClipboardCheck
} from 'lucide-react'
import { QUIZ_QUESTIONS, SPEAKER_SPLIT } from '../data/projectData'
import PythonLine from './PythonLine'

const CATEGORIES = ['All', 'Functions', 'File I/O', 'Loops & Lists', 'Edge Cases']
const LETTERS = ['A', 'B', 'C', 'D']

const SPEAKER_BADGE = {
  indigo: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
}

export default function QuizAndPresentation({ onAskTutor }) {
  // Default: real one-by-one quiz mode ('quiz'), with compact corner toggle to 'all'
  const [viewMode, setViewMode] = useState('quiz')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [finished, setFinished] = useState(false)
  const [answers, setAnswers] = useState({})
  const [openHints, setOpenHints] = useState({})
  const [streak, setStreak] = useState(0)
  const [category, setCategory] = useState('All')

  const total = QUIZ_QUESTIONS.length
  const currentQ = QUIZ_QUESTIONS[currentIdx]
  const currentPick = answers[currentQ.id]
  const currentAnswered = currentPick !== undefined
  const currentCorrect = currentPick === currentQ.answer

  const answeredCount = Object.keys(answers).length
  const correctCount = QUIZ_QUESTIONS.reduce(
    (acc, q) => acc + (answers[q.id] === q.answer ? 1 : 0),
    0
  )
  const pct = Math.round((correctCount / total) * 100)

  const handleQuizAnswer = (q, optIdx) => {
    // In Quiz Mode, lock once answered so it feels like a real quiz
    if (viewMode === 'quiz' && answers[q.id] !== undefined) return
    const alreadyRight = answers[q.id] === q.answer
    setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
    if (optIdx === q.answer) {
      if (!alreadyRight) setStreak((s) => s + 1)
    } else {
      setStreak(0)
    }
  }

  const goNextQuestion = () => {
    if (currentIdx < total - 1) {
      setCurrentIdx((i) => i + 1)
    } else {
      setFinished(true)
    }
  }

  const retakeQuiz = () => {
    setAnswers({})
    setOpenHints({})
    setStreak(0)
    setCurrentIdx(0)
    setFinished(false)
    setViewMode('quiz')
  }

  const filteredAll =
    category === 'All'
      ? QUIZ_QUESTIONS
      : QUIZ_QUESTIONS.filter((q) => q.category === category)

  const missedQuestions = QUIZ_QUESTIONS.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] !== q.answer
  )

  return (
    <div className="space-y-10">
      {/* Quiz Section */}
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1.5">
              <Trophy className="w-3.5 h-3.5" /> Module 05 · Interactive Assessment
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              {viewMode === 'quiz' ? 'CSCI 1380 Mastery Quiz' : 'All 12 Study Questions'}
            </h2>
            <p className="text-zinc-400 text-sm md:text-base mt-1 max-w-2xl">
              {viewMode === 'quiz'
                ? 'Take the quiz one question at a time. Every answer reveals the true solution and explains why.'
                : 'Browse and filter all 12 questions at once to review specific concepts before Monday.'}
            </p>
          </div>

          {/* Compact Corner Toggle: Quiz Mode vs View All */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="inline-flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800">
              <button
                onClick={() => setViewMode('quiz')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  viewMode === 'quiz'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5" /> Quiz Mode
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  viewMode === 'all'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> View All ({total})
              </button>
            </div>

            <button
              onClick={retakeQuiz}
              title="Restart Quiz"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white cursor-pointer transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= VIEW 1: ONE-BY-ONE QUIZ MODE ================= */}
        {viewMode === 'quiz' ? (
          <div className="max-w-3xl mx-auto space-y-5">
            {/* Segmented Progress Header */}
            <div className="rounded-2xl border border-zinc-800 studio-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-white">
                    {finished ? 'Quiz Complete' : `Question ${currentIdx + 1} of ${total}`}
                  </span>
                  {streak >= 2 && !finished && (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-amber-500/15 border border-amber-500/35 text-amber-300"
                    >
                      <Flame className="w-3 h-3" /> {streak} streak
                    </motion.span>
                  )}
                </div>
                <span className="font-mono text-emerald-300 font-bold">
                  Score: {correctCount} / {answeredCount || total}
                </span>
              </div>

              {/* 12 Non-clickable Progress Segments (Real Quiz Feel) */}
              <div className="grid grid-cols-12 gap-1.5">
                {QUIZ_QUESTIONS.map((q, idx) => {
                  const ans = answers[q.id]
                  const isRight = ans !== undefined && ans === q.answer
                  const isWrong = ans !== undefined && ans !== q.answer
                  const isNow = !finished && idx === currentIdx
                  return (
                    <div
                      key={q.id}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isRight
                          ? 'bg-emerald-500'
                          : isWrong
                          ? 'bg-rose-500'
                          : isNow
                          ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]'
                          : 'bg-zinc-800'
                      }`}
                    />
                  )
                })}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!finished ? (
                <motion.div
                  key={currentQ.id}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="rounded-2xl border border-zinc-800 studio-card p-6 sm:p-7 space-y-5"
                >
                  {/* Meta Row */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-200">
                        {currentQ.category}
                      </span>
                      {currentQ.difficulty === 'Key Question' && (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Professor Favorite
                        </span>
                      )}
                    </div>

                    {!currentAnswered && (
                      <button
                        onClick={() =>
                          setOpenHints((prev) => ({
                            ...prev,
                            [currentQ.id]: !prev[currentQ.id],
                          }))
                        }
                        className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-sky-300 cursor-pointer transition"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        {openHints[currentQ.id] ? 'Hide Hint' : 'Need a Hint?'}
                      </button>
                    )}
                  </div>

                  {/* Question Text */}
                  <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                    {currentQ.q}
                  </h3>

                  {/* Code Snippet */}
                  {currentQ.code && (
                    <div className="rounded-xl bg-[#0a0b0e] border border-zinc-800/90 px-4 py-3 font-mono text-xs sm:text-[13px] leading-relaxed overflow-x-auto">
                      {currentQ.code.split('\n').map((ln, idx) => (
                        <div key={idx} className="whitespace-pre">
                          <PythonLine line={ln} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Hint Drawer */}
                  <AnimatePresence>
                    {openHints[currentQ.id] && !currentAnswered && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/25 text-xs sm:text-sm text-sky-200">
                          <strong>Hint:</strong> {currentQ.hint}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Answer Choices */}
                  <div className="space-y-2.5">
                    {currentQ.options.map((opt, oIdx) => {
                      const isChosen = currentPick === oIdx
                      const isTrueAnswer = oIdx === currentQ.answer
                      const revealCorrect = currentAnswered && isTrueAnswer
                      const revealWrong = currentAnswered && isChosen && !isTrueAnswer

                      return (
                        <motion.button
                          key={oIdx}
                          whileHover={!currentAnswered ? { scale: 1.008 } : undefined}
                          whileTap={!currentAnswered ? { scale: 0.99 } : undefined}
                          disabled={currentAnswered}
                          onClick={() => handleQuizAnswer(currentQ, oIdx)}
                          className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition flex items-center justify-between gap-3 ${
                            revealCorrect
                              ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-100 font-semibold'
                              : revealWrong
                              ? 'bg-rose-500/15 border-rose-500/60 text-rose-100'
                              : currentAnswered
                              ? 'bg-zinc-950/40 border-zinc-800/60 text-zinc-500'
                              : 'bg-zinc-950/75 border-zinc-800 text-zinc-200 hover:border-emerald-500/50 hover:bg-zinc-900 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-lg font-mono text-xs font-bold inline-flex items-center justify-center shrink-0 ${
                                revealCorrect
                                  ? 'bg-emerald-500 text-zinc-950'
                                  : revealWrong
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-zinc-900 border border-zinc-700 text-zinc-400'
                              }`}
                            >
                              {LETTERS[oIdx]}
                            </span>
                            <span className="leading-snug">{opt}</span>
                          </div>

                          {revealCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          )}
                          {revealWrong && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Detailed Feedback + Next Button */}
                  {currentAnswered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 pt-1"
                    >
                      <div
                        className={`p-4 rounded-xl border text-sm leading-relaxed space-y-2 ${
                          currentCorrect
                            ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-100'
                            : 'bg-rose-500/10 border-rose-500/35 text-rose-100'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-2">
                          {currentCorrect ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Correct!
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-rose-400" /> Not quite — Correct Answer:{' '}
                              <span className="text-emerald-300">
                                {LETTERS[currentQ.answer]}) {currentQ.options[currentQ.answer]}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm opacity-95">
                          <strong className="text-white">Why:</strong> {currentQ.explain}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        {onAskTutor ? (
                          <button
                            onClick={() =>
                              onAskTutor(
                                `Explain why the correct answer to "${currentQ.q}" is "${currentQ.options[currentQ.answer]}" in simple terms.`
                              )
                            }
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-300 hover:text-sky-200 cursor-pointer transition"
                          >
                            <Mic className="w-3.5 h-3.5" /> Ask Voice Tutor to explain more
                          </button>
                        ) : (
                          <span />
                        )}

                        <button
                          onClick={goNextQuestion}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 cursor-pointer transition"
                        >
                          {currentIdx < total - 1 ? 'Next Question' : 'See Final Score'}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                /* Final Quiz Results Card */
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl border border-zinc-800 studio-card p-7 space-y-6 text-center"
                >
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center justify-center">
                    <Trophy className="w-7 h-7" />
                  </div>

                  <div className="space-y-1">
                    <div className="text-4xl font-extrabold font-mono text-white">
                      {correctCount} / {total}{' '}
                      <span className="text-emerald-400 text-2xl">({pct}%)</span>
                    </div>
                    <p className="text-sm text-zinc-300">
                      {pct === 100
                        ? 'Perfect score! You are 100% ready for Monday’s presentation.'
                        : pct >= 75
                        ? 'Strong run! Review any missed items below and you will ace the Q&A.'
                        : 'Good warm-up! Review the missed questions below and retake the quiz.'}
                    </p>
                  </div>

                  {missedQuestions.length > 0 && (
                    <div className="text-left space-y-2.5 pt-2 border-t border-zinc-800">
                      <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Review Missed Questions ({missedQuestions.length})
                      </div>
                      {missedQuestions.map((mq) => (
                        <div
                          key={mq.id}
                          className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1"
                        >
                          <div className="text-xs font-bold text-white">{mq.q}</div>
                          <div className="text-xs text-emerald-300">
                            Correct: {mq.options[mq.answer]}
                          </div>
                          <div className="text-xs text-zinc-400">{mq.explain}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={retakeQuiz}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition"
                    >
                      <RotateCcw className="w-4 h-4" /> Retake Quiz
                    </button>
                    <button
                      onClick={() => setViewMode('all')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-200 cursor-pointer transition"
                    >
                      <LayoutGrid className="w-4 h-4" /> View All {total} Questions
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* ================= VIEW 2: ALL 12 STUDY BANK ================= */
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const active = category === cat
                const count =
                  cat === 'All'
                    ? total
                    : QUIZ_QUESTIONS.filter((q) => q.category === cat).length
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      active
                        ? 'bg-emerald-500/15 border-emerald-500/45 text-emerald-200'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    {cat} <span className="opacity-60 font-mono ml-1">({count})</span>
                  </button>
                )
              })}
            </div>

            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredAll.map((item) => {
                  const pick = answers[item.id]
                  const isAnswered = pick !== undefined
                  const isCorrect = pick === item.answer
                  const showHint = !!openHints[item.id]

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-2xl border border-zinc-800 studio-card p-5 flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300">
                            {item.category}
                          </span>
                          <button
                            onClick={() =>
                              setOpenHints((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-sky-300 cursor-pointer transition"
                          >
                            <HelpCircle className="w-3.5 h-3.5" /> {showHint ? 'Hide Hint' : 'Hint'}
                          </button>
                        </div>

                        <div className="text-sm font-bold text-white leading-snug">{item.q}</div>

                        {item.code && (
                          <div className="rounded-xl bg-[#0a0b0e] border border-zinc-800/90 px-3 py-2.5 font-mono text-[11.5px] leading-relaxed overflow-x-auto">
                            {item.code.split('\n').map((ln, idx) => (
                              <div key={idx} className="whitespace-pre">
                                <PythonLine line={ln} />
                              </div>
                            ))}
                          </div>
                        )}

                        {showHint && (
                          <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/25 text-xs text-sky-200">
                            <strong>Hint:</strong> {item.hint}
                          </div>
                        )}

                        <div className="space-y-2">
                          {item.options.map((opt, oIdx) => {
                            const chosen = pick === oIdx
                            const revealRight = isAnswered && oIdx === item.answer
                            const revealWrong = chosen && oIdx !== item.answer
                            return (
                              <button
                                key={oIdx}
                                onClick={() => handleQuizAnswer(item, oIdx)}
                                className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center justify-between gap-2 ${
                                  revealRight
                                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 font-semibold'
                                    : revealWrong
                                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-200'
                                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/60'
                                }`}
                              >
                                <span>{opt}</span>
                                {revealRight && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                                {revealWrong && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {isAnswered && (
                        <div
                          className={`p-3 rounded-xl text-xs leading-relaxed border space-y-1.5 ${
                            isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                          }`}
                        >
                          {!isCorrect && (
                            <div className="font-bold text-emerald-300">
                              Correct answer: {item.options[item.answer]}
                            </div>
                          )}
                          <div>
                            <strong>Why:</strong> {item.explain}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </div>

      {/* Presentation Split */}
      <div className="space-y-5 pt-6 border-t border-zinc-800/80">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky-400 mb-1.5">
            <Users className="w-3.5 h-3.5" /> Monday Presentation Plan
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Suggested 3-Person Speaking Split
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            Each teammate covers one clear section (~90 seconds) with a ready-to-speak script in natural English.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {SPEAKER_SPLIT.map((sp) => (
            <div
              key={sp.name}
              className="rounded-2xl border border-zinc-800 studio-card p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                    SPEAKER_BADGE[sp.tone]
                  }`}
                >
                  {sp.part}
                </span>
                <h3 className="text-lg font-bold text-white">{sp.name}</h3>
                <ul className="space-y-1.5 text-xs text-zinc-300 list-disc pl-4 leading-relaxed">
                  {sp.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-[#0a0b0e] border border-zinc-800 p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-400">
                    <Mic className="w-3 h-3" /> Spoken Script
                  </div>
                  {onAskTutor && (
                    <button
                      onClick={() =>
                        onAskTutor(
                          `Help ${sp.name} rehearse ${sp.part}. Ask one realistic professor question about their section.`
                        )
                      }
                      className="text-[10.5px] font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer transition"
                    >
                      Rehearse with Tutor →
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-200 italic leading-relaxed">{sp.script}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
